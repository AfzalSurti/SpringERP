import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as
    | { message?: string; errors?: Record<string, string> }
    | undefined;

  if (data?.errors) {
    const firstFieldError = Object.values(data.errors)[0];
    if (firstFieldError) {
      return firstFieldError;
    }
  }

  return data?.message || fallback;
}
