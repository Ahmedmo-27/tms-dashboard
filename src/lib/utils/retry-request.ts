function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybeAxios = error as {
    response?: { status?: number };
    message?: string;
  };

  if (maybeAxios.response?.status === 429) {
    return true;
  }

  const message = maybeAxios.message ?? "";
  return /too many requests/i.test(message);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; baseDelayMs?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 5;
  const baseDelayMs = options?.baseDelayMs ?? 1000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error) || attempt === maxRetries) {
        throw error;
      }

      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }

  throw lastError;
}

export { sleep };
