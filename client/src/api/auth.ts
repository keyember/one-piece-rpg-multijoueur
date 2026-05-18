const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '';

let accessToken: string | null = null;

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export async function register(
  email: string,
  username: string,
  password: string
): Promise<{ message: string }> {
  const res = await fetchWithAuth(`${SERVER_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue');
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<{ accessToken: string; username: string }> {
  const res = await fetchWithAuth(`${SERVER_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue');
  return data;
}

export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetchWithAuth(`${SERVER_URL}/auth/refresh`, { method: 'POST' });
  if (!res.ok) return null;
  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function logout(): Promise<void> {
  await fetchWithAuth(`${SERVER_URL}/auth/logout`, { method: 'POST' });
  clearAccessToken();
}
