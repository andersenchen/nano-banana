/**
 * Standard API error codes
 */
export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT = "RATE_LIMIT",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
}

/**
 * Maps error codes to HTTP status codes
 */
const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
  [ApiErrorCode.RATE_LIMIT]: 429,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.DATABASE_ERROR]: 500,
  [ApiErrorCode.STORAGE_ERROR]: 500,
  [ApiErrorCode.EXTERNAL_API_ERROR]: 502,
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGE_MAP: Record<ApiErrorCode, string> = {
  [ApiErrorCode.BAD_REQUEST]: "Invalid request",
  [ApiErrorCode.UNAUTHORIZED]: "Unauthorized",
  [ApiErrorCode.FORBIDDEN]: "Forbidden",
  [ApiErrorCode.NOT_FOUND]: "Resource not found",
  [ApiErrorCode.CONFLICT]: "Resource conflict",
  [ApiErrorCode.VALIDATION_ERROR]: "Validation failed",
  [ApiErrorCode.RATE_LIMIT]: "Rate limit exceeded",
  [ApiErrorCode.INTERNAL_ERROR]: "Internal server error",
  [ApiErrorCode.DATABASE_ERROR]: "Database error",
  [ApiErrorCode.STORAGE_ERROR]: "Storage error",
  [ApiErrorCode.EXTERNAL_API_ERROR]: "External service error",
};

/**
 * Standard error response structure
 */
interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Options for error handling
 */
interface ErrorHandlerOptions {
  /** Custom error message to override default */
  message?: string;
  /** Additional error details to include in response */
  details?: unknown;
  /** Whether to log the error (default: true for 5xx, false for 4xx) */
  log?: boolean;
}

/**
 * Creates a standardized error response
 *
 * @param errorCode - The API error code
 * @param options - Optional configuration
 * @returns Response object with error details
 */
export function createErrorResponse(
  errorCode: ApiErrorCode,
  options: ErrorHandlerOptions = {}
): Response {
  const statusCode = ERROR_STATUS_MAP[errorCode];
  const message = options.message || ERROR_MESSAGE_MAP[errorCode];

  // Determine if we should log (default: log server errors, not client errors)
  const shouldLog = options.log ?? (statusCode >= 500);

  if (shouldLog) {
    console.error(`[API Error] ${errorCode}: ${message}`, {
      statusCode,
      details: options.details,
    });
  }

  const response: ErrorResponse = {
    error: message,
    code: errorCode,
  };

  // Only include details in development or for server errors
  if (options.details && (process.env.NODE_ENV === "development" || statusCode >= 500)) {
    response.details = options.details;
  }

  return Response.json(response, { status: statusCode });
}

/**
 * Wraps an async API handler with error handling
 *
 * @param handler - The async function to wrap
 * @returns Response object
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("Unhandled API error:", error);

      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, {
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Creates a success response
 *
 * @param data - The data to return
 * @param options - Optional configuration
 * @returns Response object with data
 */
export function createSuccessResponse<T>(
  data: T,
  options: { status?: number; meta?: Record<string, unknown> } = {}
): Response {
  const response = {
    success: true,
    data,
    ...(options.meta && { meta: options.meta }),
  };

  return Response.json(response, { status: options.status || 200 });
}

/**
 * Validation error helper
 *
 * @param message - Validation error message
 * @param details - Optional field-level validation errors
 * @returns Response object
 */
export function validationError(
  message: string,
  details?: Record<string, string[]>
): Response {
  return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, {
    message,
    details,
  });
}

/**
 * Not found error helper
 *
 * @param resource - The resource that was not found (e.g., "Image", "User")
 * @returns Response object
 */
export function notFoundError(resource = "Resource"): Response {
  return createErrorResponse(ApiErrorCode.NOT_FOUND, {
    message: `${resource} not found`,
  });
}

/**
 * Unauthorized error helper
 *
 * @param message - Optional custom message
 * @returns Response object
 */
export function unauthorizedError(message?: string): Response {
  return createErrorResponse(ApiErrorCode.UNAUTHORIZED, {
    message: message || "Authentication required",
  });
}

/**
 * Forbidden error helper
 *
 * @param message - Optional custom message
 * @returns Response object
 */
export function forbiddenError(message?: string): Response {
  return createErrorResponse(ApiErrorCode.FORBIDDEN, {
    message: message || "You don't have permission to access this resource",
  });
}
