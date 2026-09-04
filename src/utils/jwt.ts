//wrapper around signtoken , verify token 
import jwt from "jsonwebtoken"; 
import { env } from "../config/env"; 


export interface TokenPayload { 
    userId : number; 
} 

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
}


export function verifyToken(token: string): TokenPayload {
  // Throws if the token is invalid, expired, or tampered with.
  // Callers (the auth middleware) are expected to catch this.
  return jwt.verify(token, env.jwt.secret) as TokenPayload;
}