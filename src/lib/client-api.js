import { fallbackServices } from "@/data/servicesData";

/* Client-side compatibility API backed by the central Admin MongoDB API with 0ms SWR caching. */
const json = async (response) => {
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok || body?.ok === false || body?.success === false) {
    throw new Error(
      `API ${response.status}: ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`
    );
  }
  return body;
};

export const db = { __adminApi: true };

export function doc(...segments) {
  return { __type: "doc", segments };
}

export function collection(...segments) {
  return { __type: "collection", segments };
}

function pageFromDocSegments(segments = []) {
  const parts = segments.filter(Boolean).map(String);
  const pagesIndex = parts.indexOf("pages");
  if (pagesIndex >= 0 && parts[pagesIndex + 1]) return {
    type: parts[pagesIndex + 1],
    pageType: parts[pagesIndex + 1],
  };

  const districtsIndex = parts.indexOf("districts");
  if (districtsIndex >= 0 && parts[districtsIndex + 1]) return {
    type: "district",
    pageType: "district",
    district: parts[districtsIndex + 1],
  };

  return {};
}

// Client-side in-memory & local cache
const clientDocCache = new Map();
const inFlightDocRequests = new Map();
const CLIENT_DOC_FRESH_MS = 30 * 1000; // 30s
const STORAGE_PREFIX = "diagnotex_doc_v2_";

// Pre-seed default fallback cache for instant 0ms mount
if (typeof window !== "undefined") {
  // Pre-seed services if needed
  clientDocCache.set("services", {
    timestamp: Date.now(),
    data: { services: fallbackServices },
  });
}

export function getCachedDoc(ref) {
  const params = pageFromDocSegments(ref?.segments || []);
  const key = params.type === "district" ? `dist_${params.district}` : (params.type || "unknown");
  
  if (clientDocCache.has(key)) {
    const entry = clientDocCache.get(key);
    return entry.data;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.data !== undefined) {
          clientDocCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  if (key === "services") {
    return { services: fallbackServices };
  }

  return null;
}

function saveDocToCache(key, data) {
  const entry = { timestamp: Date.now(), data };
  clientDocCache.set(key, entry);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // Ignore quota errors
    }
  }
}

export async function getDoc(ref) {
  const params = pageFromDocSegments(ref?.segments || []);
  const key = params.type === "district" ? `dist_${params.district}` : (params.type || "unknown");
  const cachedData = getCachedDoc(ref);
  const now = Date.now();
  const cachedEntry = clientDocCache.get(key);
  const isFresh = cachedEntry && (now - cachedEntry.timestamp < CLIENT_DOC_FRESH_MS);

  // Return snapshot helper
  const createSnap = (val) => ({
    exists: () => val !== null && val !== undefined,
    data: () => val,
  });

  // If fresh, return immediately (0ms)
  if (isFresh && cachedData !== null && cachedData !== undefined) {
    return createSnap(cachedData);
  }

  // If we have stale cache, trigger background revalidation and return immediately
  if (cachedData !== null && cachedData !== undefined) {
    if (!inFlightDocRequests.has(key)) {
      const bgPromise = fetch(`/api/site-data?${new URLSearchParams(params)}`)
        .then((res) => json(res))
        .then((response) => {
          const fresh = response?.data ?? response ?? null;
          if (fresh !== null && fresh !== undefined) {
            saveDocToCache(key, fresh);
          }
        })
        .catch((err) => console.error(`[getDoc] BG revalidation error for ${key}:`, err))
        .finally(() => {
          inFlightDocRequests.delete(key);
        });
      inFlightDocRequests.set(key, bgPromise);
    }
    return createSnap(cachedData);
  }

  // If in flight, await existing request
  if (inFlightDocRequests.has(key)) {
    const resData = await inFlightDocRequests.get(key);
    return createSnap(resData);
  }

  // Otherwise perform fetch
  const fetchPromise = (async () => {
    try {
      const response = await json(
        await fetch(`/api/site-data?${new URLSearchParams(params)}`)
      );
      const data = response?.data ?? response ?? null;
      if (data !== null && data !== undefined) {
        saveDocToCache(key, data);
      }
      return data;
    } catch (error) {
      console.error(`[getDoc] Error fetching ${key}:`, error);
      return cachedData;
    } finally {
      inFlightDocRequests.delete(key);
    }
  })();

  inFlightDocRequests.set(key, fetchPromise);
  const resultData = await fetchPromise;
  return createSnap(resultData);
}

export async function getDocs(ref) {
  const segments = ref?.segments || [];
  const parts = segments.filter(Boolean).map(String);

  if (parts.includes("districts")) {
    const response = await json(
      await fetch("/api/site-data?districts=1")
    );
    const rows = Array.isArray(response)
      ? response
      : response?.data?.districts ?? response?.districts ?? response?.data ?? [];
    return {
      empty: rows.length === 0,
      docs: rows.map((row, index) => ({
        id: row?.id || row?.slug || `dist-${index}`,
        data: () => row,
      })),
    };
  }

  const response = await json(
    await fetch("/api/catalog")
  );
  const rows =
    response?.products ?? response?.data?.products ?? response?.data ?? response;
  const products = Array.isArray(rows) ? rows : [];
  return {
    empty: products.length === 0,
    docs: products.map((row, index) => ({
      id: row?.id || row?.uid || row?.productId || `product-${index}`,
      data: () => row,
    })),
  };
}

export async function addDoc(ref, payload = {}) {
  const parts = ref?.segments || [];
  const joined = parts.map(String).join("/");
  const endpoint = joined.includes("contactQueries")
    ? "/api/contact-query"
    : "/api/product-query";

  const response = await json(
    await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );

  return response;
}
