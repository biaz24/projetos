export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};

// Grava os dois cookies de sessão (login, renovação e troca de senha usam o mesmo).
export function definirCookiesDeSessao(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutos
  });

  res.cookie("refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  });
}
