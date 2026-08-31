const API_BASE = ""; // O proxy do Vite redirecionará /auth, /usuarios, /ideias, etc. para o backend

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...options,
    credentials: "include", // Garante o envio e recebimento de cookies HttpOnly
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response = await fetch(`${API_BASE}${url}`, config);

  // Se a requisição retornar 401 e não for a própria rota de refresh/login/me inicial
  if (
    response.status === 401 &&
    retry &&
    !url.includes("/auth/login") &&
    !url.includes("/auth/refresh")
  ) {
    if (isRefreshing) {
      // Se já estiver atualizando o token, aguarda na fila
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => fetchApi<T>(url, options, false));
    }

    isRefreshing = true;

    try {
      // Tenta renovar o token via cookie refreshToken
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        processQueue(null);
        isRefreshing = false;
        // Re-tenta a requisição original com o novo accessToken renovado no cookie
        return fetchApi<T>(url, options, false);
      } else {
        processQueue(new Error("Sessão expirada"));
        isRefreshing = false;
        throw new Error("Sessão expirada. Faça login novamente.");
      }
    } catch (err) {
      processQueue(err as Error);
      isRefreshing = false;
      throw err;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.erro || "Ocorreu um erro no servidor.");
  }

  return data as T;
}
