/**
 * API 클라이언트 설정
 * - 기본 URL 및 공통 설정
 * - 에러 처리
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * API 에러 클래스
 * - 항상 Error 인스턴스를 throw하여 디버깅 용이
 */
export class ApiError extends Error {
  status?: number;
  type: "network" | "server" | "parse" | "unknown";
  url?: string;
  responseText?: string;

  constructor(
    message: string,
    type: "network" | "server" | "parse" | "unknown" = "unknown",
    status?: number,
    url?: string,
    responseText?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
    this.url = url;
    this.responseText = responseText;

    // Error의 stack trace를 올바르게 유지
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * API 요청 옵션
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

/**
 * API 요청 함수
 * - 네트워크 에러와 서버 에러를 구분
 * - 빈 응답을 에러로 처리하지 않음
 * - 상세한 에러 로깅
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // URL 파라미터 추가
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // 기본 헤더 설정
  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // 디버깅: API 호출 로그
  console.log("[API Request]", {
    method: fetchOptions.method || "GET",
    url,
    hasBody: !!fetchOptions.body,
    headers: Object.keys(headers)
  });

  let response: Response | undefined;

  try {
    // fetch 호출 (네트워크/CORS 에러는 여기서 발생)
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // 디버깅: API 응답 로그
    console.log("[API Response]", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url
    });

    // 응답 본문을 먼저 텍스트로 읽기 (한 번만 읽을 수 있으므로)
    const contentType = response.headers.get("content-type") || "";
    const contentLength = response.headers.get("content-length");
    const isJson = contentType.includes("application/json");
    const isEmpty = response.status === 204 || contentLength === "0";

    // 빈 응답 처리 (에러가 아님)
    if (isEmpty) {
      console.log("[API Success (empty)]", { status: response.status });
      return {} as T;
    }

    // 응답 본문 읽기
    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("[API] Failed to read response body:", readError);
    }

    // 서버 에러 처리 (4xx, 5xx)
    if (!response.ok) {
      // 에러 메시지 추출 시도
      let errorMessage = `HTTP ${response.status} ${response.statusText || "Error"}`;
      let errorData: any = null;

      try {
        if (isJson && responseText) {
          errorData = JSON.parse(responseText);
          // 다양한 필드에서 에러 메시지 추출 시도
          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorData?.detail ||
            errorData?.errorMessage ||
            (typeof errorData === "string" ? errorData : errorMessage);
        } else if (responseText) {
          errorMessage = responseText.trim() || errorMessage;
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 원본 텍스트 사용
        errorMessage = responseText.trim() || errorMessage;
      }

      // 최종적으로 빈 메시지가 되지 않도록 보장
      if (!errorMessage || errorMessage.trim() === "") {
        errorMessage = `HTTP ${response.status} ${response.statusText || "Server Error"}`;
      }

      const errorInfo = {
        type: "server" as const,
        status: response.status,
        statusText: response.statusText,
        url,
        contentType,
        responseText: responseText.substring(0, 500), // 최대 500자만 로그
        errorMessage,
        errorData,
      };

      console.error("[API Error (Server)]", errorInfo);

      // 항상 Error 인스턴스를 throw
      throw new ApiError(
        errorMessage,
        "server",
        response.status,
        url,
        responseText
      );
    }

    // 성공 응답 처리
    try {
      if (isJson && responseText) {
        const data = JSON.parse(responseText);
        console.log("[API Success]", {
          status: response.status,
          dataKeys: Object.keys(data),
          dataSize: JSON.stringify(data).length
        });
        return data;
      } else if (responseText) {
        console.log("[API Success (text)]", {
          status: response.status,
          textLength: responseText.length
        });
        return responseText as unknown as T;
      } else {
        // 빈 본문이지만 성공 상태
        console.log("[API Success (empty body)]", { status: response.status });
        return {} as T;
      }
    } catch (parseError) {
      const parseErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);

      const errorInfo = {
        type: "parse" as const,
        status: response.status,
        url,
        contentType,
        responseText: responseText.substring(0, 500),
        parseError: parseErrorMessage,
      };

      console.error("[API Error (Parse)]", errorInfo);

      // 항상 Error 인스턴스를 throw
      throw new ApiError(
        `응답 데이터를 파싱할 수 없습니다: ${parseErrorMessage}`,
        "parse",
        response.status,
        url,
        responseText
      );
    }
  } catch (error) {
    // 이미 ApiError 인스턴스인 경우 그대로 throw
    if (error instanceof ApiError) {
      throw error;
    }

    // 네트워크/CORS 에러 처리
    const isNetworkError = error instanceof TypeError && error.message.includes("fetch");
    const isCorsError = error instanceof TypeError &&
      (error.message.includes("CORS") ||
       error.message.includes("Failed to fetch") ||
       error.message.includes("NetworkError") ||
       error.message.includes("Network request failed"));

    let errorMessage: string;
    let errorType: "network" | "server" | "parse" | "unknown";

    if (isCorsError) {
      errorMessage = "CORS 오류가 발생했습니다. 서버 설정을 확인해주세요.";
      errorType = "network";
    } else if (isNetworkError) {
      errorMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
      errorType = "network";
    } else if (error instanceof Error) {
      errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";
      errorType = "unknown";
    } else {
      errorMessage = "알 수 없는 오류가 발생했습니다.";
      errorType = "unknown";
    }

    // 최종적으로 빈 메시지가 되지 않도록 보장
    if (!errorMessage || errorMessage.trim() === "") {
      errorMessage = "알 수 없는 오류가 발생했습니다.";
    }

    const errorInfo = {
      type: errorType,
      url,
      errorMessage,
      originalError: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
      hasResponse: !!response,
      responseStatus: response?.status,
    };

    console.error("[API Error]", errorInfo);

    // 항상 Error 인스턴스를 throw
    throw new ApiError(
      errorMessage,
      errorType,
      response?.status,
      url
    );
  }
}

/**
 * GET 요청
 */
export async function apiGet<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "GET",
    params,
  });
}

/**
 * POST 요청
 */
export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 요청
 */
export async function apiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 요청
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "DELETE",
  });
}
