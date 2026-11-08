const origin = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
const url = (path: string) => `${origin}/api/v1${path}`;
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url(path), {
      ...options, credentials: 'include', cache: 'no-store', signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new ApiError('The API did not return JSON. Verify the admin API URL.', 502);
    const data = await response.json() as T & { message?: string };
    if (!response.ok) throw new ApiError(data.message || `Request failed (${response.status})`, response.status);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError('Request timed out. Check your connection.', 0);
    throw error;
  } finally { window.clearTimeout(timeout); }
}
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong';
