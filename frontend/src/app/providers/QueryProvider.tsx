import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/domain/models/ApiError";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (n, err) => n < 2 && isApiError(err) && err.retryable,
      },
    },
  });
}
