interface ApiResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: ApiResponseMeta;
}

export const formatResponse = <T>(
  message: string,
  data: T | null = null,
  meta?: ApiResponseMeta,
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
};
export type { ApiResponse, ApiResponseMeta };
