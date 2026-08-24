import jwt from "jsonwebtoken";
import env from "./env.js";

export function generateAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: "15m" });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
