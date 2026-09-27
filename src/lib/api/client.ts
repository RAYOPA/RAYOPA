export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'https://rayopa.onrender.com';
  }
  return 'http://127.0.0.1:8000';
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // 12s timeout controller to avoid hanging when backend is starting
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    if (!response.ok) {
      let errorData: unknown;
      let rawText = '';
      try {
        rawText = await response.text();
        errorData = JSON.parse(rawText);
      } catch {
        errorData = rawText;
      }

      let message = `Request failed with status ${response.status}`;
      if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData) {
        message = String((errorData as { detail: unknown }).detail);
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        message = 'Backend service is starting up on Render. Please wait a few seconds and retry.';
      } else if (rawText) {
        message = rawText.length > 200 ? `${rawText.substring(0, 200)}...` : rawText;
      }

      throw new ApiError(message, response.status, errorData);
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const isTimeout = (error as any)?.name === 'AbortError';
    const message = isTimeout 
      ? 'Backend request timed out (server may be spinning up). Please retry in 20 seconds.'
      : (error instanceof Error ? error.message : 'Network connection to backend failed');
    throw new ApiError(message, 0, error);
  } finally {
    clearTimeout(timeoutId);
  }
}
