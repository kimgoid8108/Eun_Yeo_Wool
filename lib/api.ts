/**
 * API 클라이언트 설정
 * - 기본 URL 및 공통 설정
 * - 에러 처리
 */

// 환경변수 로드 확인
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://jochukback.onrender.com";

// 환경변수 로드 상태 로깅 (항상 표시하여 문제 진단 용이)
if (typeof window === "undefined") {
  // 서버 사이드
  console.log("[lib/api.ts] Server-side API_BASE_URL:", API_BASE_URL || "(EMPTY - 환경변수 미로드)");
} else {
  // 클라이언트 사이드
  console.log("[lib/api.ts] Client-side API_BASE_URL:", API_BASE_URL || "(EMPTY - 환경변수 미로드)");
}

// 환경변수가 없으면 상세한 안내
if (!API_BASE_URL) {
  console.warn(
    "[lib/api.ts] ⚠️ NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다!\n" +
      "해결 방법:\n" +
      "1. 프로젝트 루트에 .env.local 파일 생성\n" +
      "2. 다음 내용 추가: NEXT_PUBLIC_API_BASE_URL=https://jochukback-production.up.railway.app\n" +
      "3. 개발 서버 재시작 (중요!): Ctrl+C 후 npm run dev\n" +
      "\n" +
      "현재 상태: 상대 경로로 요청하므로 Next.js 서버를 호출할 수 있습니다.\n" +
      "HTML 응답이 오면 자동으로 감지하여 에러를 표시합니다."
  );
}

/**
 * API 에러 클래스
 * - 항상 Error 인스턴스를 throw하여 디버깅 용이
 */
export class ApiError extends Error {
  status?: number;
  type: "network" | "server" | "parse" | "unknown";
  url?: string;
  responseText?: string;

  constructor(message: string, type: "network" | "server" | "parse" | "unknown" = "unknown", status?: number, url?: string, responseText?: string) {
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
async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // API_BASE_URL이 비어있으면 즉시 에러 throw (상대 경로로 인한 Next.js 서버 호출 방지)
  if (!API_BASE_URL || API_BASE_URL.trim() === "") {
    const errorMessage =
      `❌ API_BASE_URL이 설정되지 않았습니다!\n\n` +
      `현재 상황: 상대 경로(${endpoint})로 요청하면 Next.js 서버가 호출되어 HTML이 반환됩니다.\n\n` +
      `해결 방법:\n` +
      `1. 프로젝트 루트에 .env.local 파일 생성 (또는 확인)\n` +
      `2. 다음 내용 추가:\n` +
      `   NEXT_PUBLIC_API_BASE_URL=https://jochukback-production.up.railway.app\n` +
      `3. 개발 서버 재시작 (중요!): Ctrl+C 후 npm run dev\n` +
      `4. 브라우저 콘솔에서 [lib/api.ts] 로그 확인\n\n` +
      `참고: .env 파일이 아닌 .env.local 파일을 사용해야 합니다.`;
    console.error("[API Request] FATAL:", errorMessage);
    throw new ApiError(errorMessage, "unknown");
  }

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

  // CORS 설정: 백엔드에 CORS가 설정되어 있으므로 명시적으로 CORS 모드 사용
  // credentials는 필요에 따라 'include'로 변경 가능 (쿠키/인증 정보 전송 시)
  const fetchConfig: RequestInit = {
    ...fetchOptions,
    headers,
    mode: "cors", // CORS 모드 명시적 설정
    credentials: "omit", // 기본값: 쿠키/인증 정보 전송 안 함 (필요시 'include'로 변경)
  };

  // 디버깅: API 호출 로그
  console.log("[API Request]", {
    method: fetchConfig.method || "GET",
    endpoint,
    baseUrl: API_BASE_URL,
    fullUrl: url,
    hasBody: !!fetchConfig.body,
    mode: fetchConfig.mode,
    credentials: fetchConfig.credentials,
    headers: Object.keys(headers),
  });

  let response: Response | undefined;

  try {
    // fetch 호출 (네트워크/CORS 에러는 여기서 발생)
    response = await fetch(url, fetchConfig);

    // 디버깅: API 응답 로그
    console.log("[API Response]", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url,
    });

    // Content-Type 및 Content-Length 확인
    const contentType = response.headers.get("content-type") || "";
    const contentLength = response.headers.get("content-length");
    const isJson = contentType.includes("application/json");
    const isHtml = contentType.includes("text/html");
    const isNoContent = response.status === 204 || response.status === 205;

    // 성공 응답(2xx)에서도 Content-Type 검증 (JSON이 아니면 에러)
    if (response.ok && !isNoContent && !isJson) {
      const errorMessage =
        `❌ 서버가 JSON이 아닌 응답을 반환했습니다!\n\n` +
        `요청 URL: ${url}\n` +
        `Content-Type: ${contentType || "(없음)"}\n` +
        `예상: application/json\n` +
        `실제: ${contentType || "text/html 또는 기타"}\n\n` +
        `이는 잘못된 API 엔드포인트를 호출했거나 Next.js 서버를 호출한 것입니다.`;
      console.error("[API Request] Non-JSON Response Detected:", {
        url,
        status: response.status,
        contentType,
        apiBaseUrl: API_BASE_URL,
      });
      throw new ApiError(errorMessage, "server", response.status, url);
    }

    // HTML 응답 감지 (잘못된 엔드포인트 호출 시)
    if (isHtml && !response.ok) {
      const isRelativePath = !url.startsWith("http://") && !url.startsWith("https://");
      const errorMessage =
        `❌ 서버가 HTML을 반환했습니다!\n\n` +
        `원인: ${isRelativePath ? "상대 경로로 요청하여 Next.js 서버가 호출되었습니다." : "잘못된 API 엔드포인트를 호출했습니다."}\n\n` +
        `요청 URL: ${url}\n` +
        `예상 API URL: ${API_BASE_URL}${endpoint}\n` +
        `API_BASE_URL: ${API_BASE_URL || "(비어있음)"}\n\n` +
        `해결 방법:\n` +
        `1. .env.local 파일에 NEXT_PUBLIC_API_BASE_URL이 올바르게 설정되어 있는지 확인\n` +
        `2. 개발 서버를 재시작했는지 확인 (환경변수 변경 후 필수)\n` +
        `3. 브라우저 콘솔에서 [lib/api.ts] Client-side API_BASE_URL 로그 확인`;
      console.error("[API Request] HTML Response Detected:", {
        url,
        status: response.status,
        contentType,
        isRelativePath,
        apiBaseUrl: API_BASE_URL,
      });
      throw new ApiError(errorMessage, "server", response.status, url);
    }

    // 204/205 No Content는 본문이 없으므로 바로 처리
    if (isNoContent) {
      console.log("[API Success (204/205 No Content)]", { status: response.status });
      return {} as T;
    }

    // 응답 본문을 안전하게 텍스트로 읽기 (한 번만 읽을 수 있으므로)
    let responseText = "";
    try {
      responseText = await response.text();
    } catch (readError) {
      console.warn("[API] Failed to read response body:", readError);
      responseText = "";
    }

    // HTML 응답 감지 (본문 확인)
    if (isHtml || (responseText.trim().startsWith("<") && (responseText.toLowerCase().includes("<!doctype") || responseText.toLowerCase().includes("<html")))) {
      const isRelativePath = !url.startsWith("http://") && !url.startsWith("https://");
      const errorMessage =
        `❌ 서버가 HTML을 반환했습니다!\n\n` +
        `원인: ${isRelativePath ? "상대 경로로 요청하여 Next.js 서버가 호출되었습니다." : "잘못된 API 엔드포인트를 호출했습니다."}\n\n` +
        `요청 URL: ${url}\n` +
        `예상 API URL: ${API_BASE_URL}${endpoint}\n` +
        `API_BASE_URL: ${API_BASE_URL || "(비어있음)"}\n` +
        `응답 상태: ${response.status} ${response.statusText}\n\n` +
        `해결 방법:\n` +
        `1. .env.local 파일에 NEXT_PUBLIC_API_BASE_URL이 올바르게 설정되어 있는지 확인\n` +
        `2. 개발 서버를 재시작했는지 확인 (환경변수 변경 후 필수)\n` +
        `3. 브라우저 콘솔에서 [lib/api.ts] Client-side API_BASE_URL 로그 확인\n\n` +
        `응답 미리보기: ${responseText.substring(0, 200)}`;
      console.error("[API Request] HTML Response Detected in body:", {
        url,
        status: response.status,
        contentType,
        isRelativePath,
        apiBaseUrl: API_BASE_URL,
        bodyPreview: responseText.substring(0, 500),
      });
      throw new ApiError(errorMessage, "server", response.status, url, responseText);
    }

    // 빈 본문 체크 (Content-Length가 0이거나 실제로 빈 문자열)
    const isEmptyBody = contentLength === "0" || responseText.trim() === "";

    // 서버 에러 처리 (4xx, 5xx)
    if (!response.ok) {
      // 기본 에러 메시지 (항상 유효한 값 보장)
      const defaultMessage = `HTTP ${response.status} ${response.statusText || "Error"}`;
      let errorMessage = defaultMessage;
      let parsedErrorData: any = null;

      // 본문이 있는 경우에만 파싱 시도
      if (responseText && responseText.trim()) {
        try {
          // JSON 응답인 경우 파싱 시도
          if (isJson) {
            try {
              parsedErrorData = JSON.parse(responseText);

              // 파싱된 객체에서 에러 메시지 추출 (여러 필드 시도)
              if (parsedErrorData && typeof parsedErrorData === "object") {
                // 여러 필드에서 에러 메시지 찾기 (문자열로 변환)
                const possibleMessage = parsedErrorData.message || parsedErrorData.error || parsedErrorData.detail || parsedErrorData.errorMessage || parsedErrorData.msg;

                // 찾은 메시지가 문자열이면 사용, 아니면 기본 메시지 사용
                if (possibleMessage && typeof possibleMessage === "string") {
                  errorMessage = possibleMessage;
                } else if (possibleMessage) {
                  // 객체나 다른 타입인 경우 JSON 문자열로 변환
                  errorMessage = JSON.stringify(possibleMessage);
                } else {
                  errorMessage = defaultMessage;
                }
              } else if (typeof parsedErrorData === "string") {
                errorMessage = parsedErrorData || defaultMessage;
              }
            } catch (jsonParseError) {
              // JSON 파싱 실패: 원본 텍스트 사용
              errorMessage = responseText.trim() || defaultMessage;
            }
          } else {
            // JSON이 아닌 경우: 원본 텍스트 사용 (HTML, 텍스트 등)
            errorMessage = responseText.trim() || defaultMessage;
          }
        } catch (parseError) {
          // 모든 파싱 실패: 원본 텍스트 또는 기본 메시지
          errorMessage = responseText.trim() || defaultMessage;
        }
      }

      // 최종 검증: 빈 메시지 방지
      if (!errorMessage || (typeof errorMessage === "string" && errorMessage.trim() === "") || typeof errorMessage !== "string") {
        errorMessage = defaultMessage;
      }

      // 로깅용 정보 구성 (null/undefined 제거)
      const errorInfo: Record<string, any> = {
        type: "server",
        status: response.status,
        statusText: response.statusText || null,
        url,
        contentType: contentType || null,
        hasBody: !!responseText,
        bodyLength: responseText.length,
        bodyPreview: responseText.substring(0, 500), // 최대 500자만 로그
        errorMessage,
      };

      // 파싱된 데이터가 있으면 추가 (null이 아닌 경우만)
      if (parsedErrorData !== null) {
        errorInfo.parsedData = parsedErrorData;
      }

      console.error("[API Error (Server)]", errorInfo);

      // 항상 ApiError 인스턴스를 throw (message, status, type 보장)
      throw new ApiError(errorMessage, "server", response.status, url, responseText || undefined);
    }

    // 성공 응답 처리
    try {
      // 빈 본문인 경우
      if (isEmptyBody) {
        console.log("[API Success (empty body)]", { status: response.status });
        return {} as T;
      }

      // 성공 응답은 반드시 JSON이어야 함 (이미 위에서 검증됨)
      if (!isJson) {
        const errorMessage =
          `❌ 서버가 JSON이 아닌 응답을 반환했습니다!\n\n` +
          `요청 URL: ${url}\n` +
          `Content-Type: ${contentType || "(없음)"}\n` +
          `예상: application/json\n` +
          `실제: ${contentType || "text/html 또는 기타"}\n\n` +
          `이는 잘못된 API 엔드포인트를 호출했거나 Next.js 서버를 호출한 것입니다.`;
        console.error("[API Request] Non-JSON Success Response:", {
          url,
          status: response.status,
          contentType,
          bodyPreview: responseText.substring(0, 200),
        });
        throw new ApiError(errorMessage, "server", response.status, url, responseText);
      }

      // JSON 응답 처리
      if (isJson && responseText) {
        try {
          const data = JSON.parse(responseText);
          console.log("[API Success]", {
            status: response.status,
            dataKeys: Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data),
            dataSize: JSON.stringify(data).length,
          });
          return data;
        } catch (jsonParseError) {
          // JSON 파싱 실패
          const parseErrorMessage = jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError);

          const errorInfo = {
            type: "parse" as const,
            status: response.status,
            url,
            contentType,
            bodyPreview: responseText.substring(0, 500),
            parseError: parseErrorMessage,
          };

          console.error("[API Error (Parse)]", errorInfo);

          throw new ApiError(`JSON 응답을 파싱할 수 없습니다: ${parseErrorMessage}`, "parse", response.status, url, responseText);
        }
      }

      // 빈 본문이지만 성공 상태 (이미 위에서 처리되지만 안전장치)
      console.log("[API Success (empty body fallback)]", { status: response.status });
      return {} as T;
    } catch (error) {
      // ApiError는 그대로 throw
      if (error instanceof ApiError) {
        throw error;
      }

      // 기타 파싱 에러
      const parseErrorMessage = error instanceof Error ? error.message : String(error);

      const errorInfo = {
        type: "parse" as const,
        status: response.status,
        url,
        contentType,
        bodyPreview: responseText.substring(0, 500),
        parseError: parseErrorMessage,
      };

      console.error("[API Error (Parse)]", errorInfo);

      throw new ApiError(`응답 데이터를 파싱할 수 없습니다: ${parseErrorMessage}`, "parse", response.status, url, responseText || undefined);
    }
  } catch (error) {
    // 이미 ApiError 인스턴스인 경우 그대로 throw
    if (error instanceof ApiError) {
      throw error;
    }

    // 네트워크/CORS 에러 처리
    const errorMessage_lower = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const isNetworkError = error instanceof TypeError && errorMessage_lower.includes("fetch");
    const isCorsError =
      error instanceof TypeError &&
      (errorMessage_lower.includes("cors") ||
        errorMessage_lower.includes("failed to fetch") ||
        errorMessage_lower.includes("networkerror") ||
        errorMessage_lower.includes("network request failed") ||
        errorMessage_lower.includes("access-control"));

    let errorMessage: string;
    let errorType: "network" | "server" | "parse" | "unknown";

    if (isCorsError) {
      errorMessage =
        `❌ CORS 오류가 발생했습니다!\n\n` +
        `요청 URL: ${url}\n` +
        `API_BASE_URL: ${API_BASE_URL}\n\n` +
        `가능한 원인:\n` +
        `1. 백엔드 서버의 CORS 설정이 프론트엔드 도메인(localhost:3000)을 허용하지 않음\n` +
        `2. 백엔드 서버가 OPTIONS 요청(Preflight)을 처리하지 않음\n` +
        `3. 백엔드 서버의 CORS 설정에 필요한 헤더가 누락됨\n\n` +
        `해결 방법:\n` +
        `1. 백엔드 서버의 CORS 설정 확인 (Access-Control-Allow-Origin에 localhost:3000 포함)\n` +
        `2. 백엔드 서버가 OPTIONS 메서드를 허용하는지 확인\n` +
        `3. 브라우저 개발자 도구의 Network 탭에서 실제 요청/응답 헤더 확인\n\n` +
        `원본 에러: ${error instanceof Error ? error.message : String(error)}`;
      errorType = "network";
    } else if (isNetworkError) {
      errorMessage =
        `❌ 네트워크 오류가 발생했습니다!\n\n` +
        `요청 URL: ${url}\n\n` +
        `가능한 원인:\n` +
        `1. 인터넷 연결 문제\n` +
        `2. 백엔드 서버가 다운되었거나 접근 불가\n` +
        `3. 방화벽 또는 보안 정책으로 인한 차단\n\n` +
        `해결 방법:\n` +
        `1. 인터넷 연결 확인\n` +
        `2. 백엔드 서버 상태 확인: ${API_BASE_URL}\n` +
        `3. 브라우저 개발자 도구의 Network 탭에서 요청 상태 확인\n\n` +
        `원본 에러: ${error instanceof Error ? error.message : String(error)}`;
      errorType = "network";
    } else if (error instanceof Error) {
      errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";
      errorType = "unknown";
    } else {
      errorMessage = "알 수 없는 오류가 발생했습니다.";
      errorType = "unknown";
    }

    // 최종적으로 빈 메시지가 되지 않도록 보장
    // errorMessage가 문자열이 아닌 경우 문자열로 변환
    if (typeof errorMessage !== "string") {
      errorMessage = String(errorMessage) || "알 수 없는 오류가 발생했습니다.";
    }
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
    throw new ApiError(errorMessage, errorType, response?.status, url);
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
