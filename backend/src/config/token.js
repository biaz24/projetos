// import jwt from "jsonwebtoken";
// import env from "./env.js";

// export function generateAccessToken(payload) {
//   return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: "15m" });
// }

// export function generateRefreshToken(payload) {
//   return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: "7d" });
// }

// export function verifyAccessToken(token) {
//   return jwt.verify(token, env.jwt.accessSecret);
// }

// export function verifyRefreshToken(token) {
//   return jwt.verify(token, env.jwt.refreshSecret);
// }

import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import env from "./env.js";

const ALGORITMO = "HS256";

if (!env.jwt.accessSecret || !env.jwt.refreshSecret) {
  throw new Error("Os segredos JWT não estão configurados.");
}

if (env.jwt.accessSecret === env.jwt.refreshSecret) {
  throw new Error(
    "O segredo do access token e o do refresh token devem ser diferentes.",
  );
}

if (
  process.env.NODE_ENV === "production" &&
  (env.jwt.accessSecret.length < 32 || env.jwt.refreshSecret.length < 32)
) {
  throw new Error("Os segredos JWT devem ter pelo menos 32 caracteres.");
}

export function generateAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: "15m",
    algorithm: ALGORITMO,
  });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: "7d",
    algorithm: ALGORITMO,
    jwtid: crypto.randomUUID(), // garante que cada refresh token seja único
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret, { algorithms: [ALGORITMO] });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, { algorithms: [ALGORITMO] });
}
