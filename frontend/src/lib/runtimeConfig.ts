const localhostApiBaseUrl = 'http://localhost:3000';
const localhostWsUrl = 'ws://localhost:3000';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function withScheme(value: string, scheme: 'http' | 'ws'): string {
  if (/^https?:\/\//.test(value) || /^wss?:\/\//.test(value)) {
    return trimTrailingSlash(value);
  }

  const normalizedScheme = scheme === 'http' ? 'https://' : 'wss://';
  return `${normalizedScheme}${trimTrailingSlash(value)}`;
}

function getBrowserOrigin(): string | null {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return null;
  }

  return trimTrailingSlash(window.location.origin);
}

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return withScheme(configured, 'http');
  }

  const browserOrigin = getBrowserOrigin();
  return browserOrigin ?? localhostApiBaseUrl;
}

export function getWsUrl(): string {
  const configured = import.meta.env.VITE_WS_URL;
  if (configured) {
    return withScheme(configured, 'ws');
  }

  const browserOrigin = getBrowserOrigin();
  if (!browserOrigin) {
    return localhostWsUrl;
  }

  const protocol = browserOrigin.startsWith('https://') ? 'wss://' : 'ws://';
  const host = browserOrigin.replace(/^https?:\/\//, '');
  return `${protocol}${host}`;
}
