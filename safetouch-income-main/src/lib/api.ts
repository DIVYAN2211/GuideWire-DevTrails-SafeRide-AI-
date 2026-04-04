const TOKEN_KEY = "saferide_token";
const NAME_KEY = "saferide_name";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, name: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(NAME_KEY, name);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
}

export function getStoredName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

function headers(base?: HeadersInit): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(base as Record<string, string>),
  };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: headers(init?.headers as HeadersInit),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return data as T;
}
