import dotenv from "dotenv";
import path from "path";

// Resolve relative to this file (not process.cwd()) because the Knex CLI
// changes the working directory to the migrations folder before running,
// which would otherwise cause the .env file to go undiscovered.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(required("PORT", "4000"), 10),
  nodeEnv: required("NODE_ENV", "development"),

  db: {
    host: required("DB_HOST", "127.0.0.1"),
    port: parseInt(required("DB_PORT", "3306"), 10),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: required("JWT_EXPIRES_IN", "1h"),
  },

  cookie: {
    name: required("COOKIE_NAME", "ep_token"),
    secure: required("COOKIE_SECURE", "false") === "true",
  },

  frontendOrigin: required("FRONTEND_ORIGIN", "http://localhost:5173"),

  cloudinary: {
    cloudName: required("CLOUDINARY_CLOUD_NAME"),
    apiKey: required("CLOUDINARY_API_KEY"),
    apiSecret: required("CLOUDINARY_API_SECRET"),
  }, 


    esewa: {
    merchantCode: required("ESEWA_MERCHANT_CODE", "EPAYTEST"),
    secretKey: required("ESEWA_SECRET_KEY", "8gBm/:&EnhH.1/q"),
    paymentUrl: required(
      "ESEWA_PAYMENT_URL",
      "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    ),
    statusCheckUrl: required(
      "ESEWA_STATUS_CHECK_URL",
      "https://rc.esewa.com.np/api/epay/transaction/status/"
    ),
    successUrl: required("ESEWA_SUCCESS_URL", "http://localhost:4000/api/payments/success"),
    failureUrl: required("ESEWA_FAILURE_URL", "http://localhost:4000/api/payments/failure"),
  },
};