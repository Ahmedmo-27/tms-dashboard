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
      switch (status) {
        case 400:
          return new BadRequestError(data.message || "Bad Request", data);
        case 404:
          return new NotFoundError(data.message || "Not Found", data);
        case 401:
          return new UnauthorizedError(data.message || "Unauthorized", data);
        case 409:
          return new ConflictError(data.message || "Conflict Error", data)
        default:
          return new InternalError(
            data.message || "Internal Server Error",
            data
          );
      }
    } else if (error.request) {
      return new NetworkError("Network Error", { error });
    } else {
      return new InternalError("Request Configuration Error", { error });
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
