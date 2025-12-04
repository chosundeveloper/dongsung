const DEFAULT_BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3001'

// Determine whether we should talk to the local backend directly
const isPrivateNetworkHost = (hostname) => {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.')
  );
};

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return `http://localhost:${DEFAULT_BACKEND_PORT}`;
  }

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // /dongsung/ 경로를 통해 접속한 경우 (Nginx 프록시)
  if (pathname.startsWith('/dongsung/')) {
    // 같은 origin의 /community-api/ 경로를 사용 (CORS 회피)
    return `${window.location.origin}/community-api`;
  }

  if (isPrivateNetworkHost(hostname)) {
    return `http://${hostname}:${DEFAULT_BACKEND_PORT}`;
  }

  // Remote 접속 시에는 현재 프론트 도메인을 그대로 사용하도록 하여
  // 단일 ngrok 호스트(또는 프록시) 아래에서 API 요청이 통하도록 만든다.
  return window.location.origin;
};

export const API_URL = getApiBaseUrl();

export const apiRequest = async (url, options = {}) => {
  const { ignoreNotFound = false, ...rest } = options;
  const init = { ...rest };
  const headers = { ...(rest.headers || {}) };

  if (!(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (Object.keys(headers).length > 0) {
    init.headers = headers;
  }

  const response = await fetch(`${API_URL}${url}`, init);

  if (ignoreNotFound && response.status === 404) {
    return { message: 'not_found', data: null };
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || '요청 중 오류가 발생했습니다.');
  }

  return data;
};
