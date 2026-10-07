import "server-only";

import { WEBSITE_ID, COMPANY_ID } from "./catalog-utils";

export const ADMIN_API_BASE_URL = (
  process.env.ADMIN_API_BASE_URL ||
  process.env.ADMIN_API_URL ||
  "https://admin.rajbiosis.app"
).replace(/\/+$/, "");

function buildUrl(pathname, params = {}) {
  const path = String(pathname || "");
  const url = new URL(
    `${ADMIN_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  );

  const query = {
    websiteId: WEBSITE_ID,
    companyId: COMPANY_ID,
    ...params,
  };

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

const serverCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60s fresh
const STALE_TTL_MS = 5 * 60 * 1000; // 5 min stale tolerance

async function performFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (
    !response.ok ||
    body?.success === false ||
    body?.ok === false
  ) {
    const message =
      typeof body === "string"
        ? body
        : JSON.stringify(body);
    throw new Error(`Admin API ${response.status}: ${message}`);
  }

  return body;
}

export async function adminFetch(pathname, options = {}, params = {}) {
  const isRead = !options.method || options.method.toUpperCase() === "GET";

  if (!isRead) {
    return performFetch(buildUrl(pathname, params), options);
  }

  const cacheKey = `${pathname}:${JSON.stringify(params)}`;
  const now = Date.now();

  if (serverCache.has(cacheKey)) {
    const entry = serverCache.get(cacheKey);
    const age = now - entry.timestamp;

    if (age < CACHE_TTL_MS) {
      return entry.data;
    }

    if (age < STALE_TTL_MS) {
      // Revalidate in background (SWR) without blocking
      if (!inFlightRequests.has(cacheKey)) {
        const bgPromise = performFetch(buildUrl(pathname, params), options)
          .then((fresh) => {
            serverCache.set(cacheKey, { timestamp: Date.now(), data: fresh });
          })
          .catch((err) => {
            console.error(`[adminFetch] BG Revalidation error for ${cacheKey}:`, err.message);
          })
          .finally(() => {
            inFlightRequests.delete(cacheKey);
          });
        inFlightRequests.set(cacheKey, bgPromise);
      }
      return entry.data;
    }
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const reqPromise = performFetch(buildUrl(pathname, params), options)
    .then((data) => {
      serverCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, reqPromise);
  return reqPromise;
}

export async function postAdminQuery(endpoint, payload = {}) {
  return adminFetch(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        websiteId: WEBSITE_ID,
        companyId: COMPANY_ID,
        ...payload,
      }),
    },
    {}
  );
}

export async function fetchCatalogFromAdmin() {
  const response = await adminFetch("/api/catalog");
  const products =
    response?.products ??
    response?.data?.products ??
    response?.data ??
    response;
  return Array.isArray(products) ? products : [];
}
