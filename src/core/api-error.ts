import { ErrorType } from "./types/errors";

export class ApiError extends Error {
  constructor(
    public message: string = "error",
    public context: Record<string, any> = {},
    public type: ErrorType
  ) {
    super(message);
  }

  public static handle(error: any): ApiError {
    if (error.response) {
      // Server responded with error
      const { data, status } = error.response;
      const message =
        typeof data === "string"
          ? data
          : data?.message || data?.error || (data?.errors ? (typeof data.errors === "string" ? data.errors : JSON.stringify(data.errors)) : undefined);
      const context = typeof data === "object" && data !== null ? data : { raw: data };
      switch (status) {
        case 400:
          return new BadRequestError(message || "Bad Request", context);
        case 404:
          return new NotFoundError(message || "Not Found", context);
        case 401:
          return new UnauthorizedError(message || "Unauthorized", context);
        case 403:
          return new UnauthorizedError(message || "Forbidden", context);
        case 409:
          return new ConflictError(message || "Conflict Error", context);
        default:
          return new InternalError(
            message || "Internal Server Error",
            context
          );
      }
    } else if (error.request) {
      const baseURL = error.config?.baseURL || process.env.NEXT_PUBLIC_TMS_API_URL;
      const code = error.code ? ` (${error.code})` : "";
      return new NetworkError(
        `Cannot reach the API at ${baseURL || "unknown URL"}${code}. Start the backend on that port and try again.`,
        { error }
      );
    } else {
      return new InternalError(error?.message || "Request Configuration Error", { error });
    }
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found", context = {}) {
    super(message, context, ErrorType.NOT_FOUND);
  }
}

export class InternalError extends ApiError {
  constructor(message = "Internal Error", context = {}) {
    super(message, context, ErrorType.INTERNAL);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request", context = {}) {
    super(message, context, ErrorType.BAD_REQUEST);
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network Error", context = {}) {
    super(message, context, ErrorType.NETWORK);
  }
}

export class ConflictError extends ApiError {
    constructor(message = "Conflict Error", context = {}) {
    super(message, context, ErrorType.CONFLICT);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", context = {}) {
    super(message, context, ErrorType.UNAUTHORIZED);
  }
}
