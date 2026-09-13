import crypto from "crypto";
import axios from "axios";
import { env } from "../config/env";

export interface EsewaPaymentFormFields {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export interface EsewaCallbackResponse {
  transaction_code: string;
  status: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
}

// eSewa's signature scheme: take the fields listed in signed_field_names,
// in that exact order, build a string like "key1=value1,key2=value2",
// then HMAC-SHA256 it with the secret key and base64-encode the result.
// Both building a NEW payload and VERIFYING a returned one use this same
// core function — the only difference is which object's values feed it.
function generateSignature(fields: Record<string, string>, signedFieldNames: string): string {
  const fieldNames = signedFieldNames.split(",");
  const message = fieldNames.map((name) => `${name}=${fields[name]}`).join(",");

  return crypto.createHmac("sha256", env.esewa.secretKey).update(message).digest("base64");
}

// Builds the full set of form fields the frontend needs to auto-submit
// as a hidden HTML form POST directly to eSewa's payment page.
export function buildPaymentFormFields(params: {
  amount: number;
  transactionUuid: string;
}): EsewaPaymentFormFields {
  // IMPORTANT: eSewa's own documented examples use plain number strings
  // ("110", not "110.00") — the signature is computed over this EXACT
  // string, so forcing decimal places here would produce a signature
  // that doesn't match what eSewa computes on their end, silently
  // breaking every real transaction. String(number) matches their
  // documented format exactly (confirmed against 3 official examples).
  const amount = String(params.amount);
  const taxAmount = "0";
  const productServiceCharge = "0";
  const productDeliveryCharge = "0";
  // total_amount must equal amount + tax + service charge + delivery charge —
  // eSewa validates this server-side and rejects the payment if it doesn't add up.
  const totalAmount = String(params.amount);

  const signedFieldNames = "total_amount,transaction_uuid,product_code";

  const fields: Record<string, string> = {
    total_amount: totalAmount,
    transaction_uuid: params.transactionUuid,
    product_code: env.esewa.merchantCode,
  };

  const signature = generateSignature(fields, signedFieldNames);

  return {
    amount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    transaction_uuid: params.transactionUuid,
    product_code: env.esewa.merchantCode,
    product_service_charge: productServiceCharge,
    product_delivery_charge: productDeliveryCharge,
    success_url: env.esewa.successUrl,
    failure_url: env.esewa.failureUrl,
    signed_field_names: signedFieldNames,
    signature,
  };
}

// eSewa redirects back with a single "data" query param — a base64
// string that decodes to the JSON response shown above.
export function decodeEsewaResponse(base64Data: string): EsewaCallbackResponse {
  const decoded = Buffer.from(base64Data, "base64").toString("utf-8");
  return JSON.parse(decoded);
}

// Recomputes the signature over the fields eSewa says it signed, and
// compares it to what they sent. If someone tampered with the response
// (e.g. manually editing total_amount in the URL), this will NOT match,
// because they don't have our secret key to produce a valid signature.
export function verifyResponseSignature(response: EsewaCallbackResponse): boolean {
  const fields: Record<string, string> = {
    transaction_code: response.transaction_code,
    status: response.status,
    total_amount: response.total_amount,
    transaction_uuid: response.transaction_uuid,
    product_code: response.product_code,
  };

  const expectedSignature = generateSignature(fields, response.signed_field_names);

  // Timing-safe comparison — a plain === check can theoretically leak
  // information about how much of the string matched via response timing.
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(response.signature);
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, actual);
}

export interface EsewaStatusCheckResult {
  status:
    | "COMPLETE"
    | "PENDING"
    | "FULL_REFUND"
    | "PARTIAL_REFUND"
    | "AMBIGUOUS"
    | "NOT_FOUND"
    | "CANCELED";
  ref_id?: string;
}

// The signature check above proves the redirect wasn't TAMPERED with,
// but not that it wasn't REPLAYED (someone resending an old, genuinely-
// valid success URL). This server-to-server call is the authoritative
// source of truth — we only ever mark an order "completed" after this
// independently confirms it with eSewa directly, never from the redirect alone.
export async function checkTransactionStatus(
  totalAmount: string,
  transactionUuid: string
): Promise<EsewaStatusCheckResult> {
  const response = await axios.get<EsewaStatusCheckResult>(env.esewa.statusCheckUrl, {
    params: {
      product_code: env.esewa.merchantCode,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
    },
  });

  return response.data;
}