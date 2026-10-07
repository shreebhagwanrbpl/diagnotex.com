import { makeSlug } from "@/lib/catalog-utils";

function normalizeProduct(item, defaultCategory = "") {
  if (!item || typeof item !== "object") return null;

  const title = String(
    item.title ||
    item.name ||
    item.productName ||
    item.itemName ||
    ""
  ).trim();

  if (!title) return null;

  const rawSlug =
    item.slug ||
    item.productSlug ||
    item.itemSlug ||
    makeSlug(title);

  const category =
    item.category ||
    item.categoryName ||
    defaultCategory ||
    "";

  const subCategory =
    item.subCategory ||
    item["sub category"] ||
    item.subCategoryName ||
    "";

  const description =
    item.desc ||
    item.description ||
    item.detail ||
    item.summary ||
    "";

  const image =
    item.image ||
    item.imgUrl ||
    item.imageUrl ||
    (Array.isArray(item.images) && item.images[0]) ||
    "";

  const images =
    Array.isArray(item.images) && item.images.length
      ? item.images
      : image
        ? [image]
        : [];

  const features =
    Array.isArray(item.features)
      ? item.features.filter(Boolean)
      : typeof item.features === "string"
        ? item.features.split(",").map((x) => x.trim()).filter(Boolean)
        : [];

  return {
    ...item,
    id: item.uid || item.id || item.categoryProductId || rawSlug,
    uid: item.uid || item.id || rawSlug,
    productId: item.productId || item.uid || item.id || rawSlug,
    categoryProductId: item.categoryProductId || "",
    title,
    name: title,
    slug: rawSlug,
    category,
    subCategory,
    description,
    desc: description,
    price: item.price || "",
    capacity: item.capacity || "",
    throughput: item.throughput || "",
    instrument: item.instrument || "",
    model: item.model || "",
    usage: item.usage || "",
    brand: item.brand || "",
    parameters: item.parameters || "",
    automation: item.automation || "",
    availability: item.availability || item.status || "",
    size: item.size || "",
    features,
    specs: item.specs && typeof item.specs === "object" ? item.specs : null,
    badge: item.badge || item.tag || "",
    status: item.status || item.availability || "",
    image,
    images,
    video: item.video || "",
    pdf: item.pdf || "",
    isPublished: item.isPublished !== false,
  };
}

export { normalizeProduct };

// In-memory catalog cache for 0ms instant loading
let memoryCatalogCache = null;
let lastFetchTime = 0;
let inFlightCatalogPromise = null;
const CACHE_FRESH_MS = 30 * 1000; // 30s considered fresh
const LOCAL_STORAGE_KEY = "diagnotex_catalog_v2";

export function getCachedProducts() {
  if (memoryCatalogCache && Array.isArray(memoryCatalogCache) && memoryCatalogCache.length > 0) {
    return memoryCatalogCache;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
          memoryCatalogCache = parsed.data;
          lastFetchTime = parsed.timestamp || 0;
          return memoryCatalogCache;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return null;
}

function saveCatalogToCache(products) {
  if (!Array.isArray(products) || products.length === 0) return;
  memoryCatalogCache = products;
  lastFetchTime = Date.now();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ timestamp: lastFetchTime, data: products })
      );
    } catch {
      // Ignore quota errors
    }
  }
}

export async function fetchAllDynamicProducts({ force = false } = {}) {
  const cached = getCachedProducts();
  const now = Date.now();
  const isFresh = !force && cached && cached.length > 0 && (now - lastFetchTime < CACHE_FRESH_MS);

  // Return fresh cache immediately
  if (isFresh) {
    return cached;
  }

  // If we have stale cache, trigger background revalidation and return cache immediately for 0ms UI
  if (!force && cached && cached.length > 0) {
    if (!inFlightCatalogPromise) {
      inFlightCatalogPromise = fetch("/api/catalog")
        .then((res) => res.json())
        .then((body) => {
          const raw = body?.products ?? body?.data?.products ?? body?.data ?? body;
          if (Array.isArray(raw) && raw.length > 0) {
            const normalized = raw.map((item) => normalizeProduct(item)).filter(Boolean);
            if (normalized.length > 0) {
              saveCatalogToCache(normalized);
            }
          }
        })
        .catch((err) => console.error("[fetchProducts] BG revalidate error:", err))
        .finally(() => {
          inFlightCatalogPromise = null;
        });
    }
    return cached;
  }

  // If no cache or force refresh, fetch synchronously
  if (inFlightCatalogPromise) {
    return inFlightCatalogPromise;
  }

  inFlightCatalogPromise = (async () => {
    try {
      const response = await fetch("/api/catalog");
      const body = await response.json();

      if (!response.ok || body?.ok === false) {
        throw new Error(body?.error || `Catalog API ${response.status}`);
      }

      const products =
        body?.products ??
        body?.data?.products ??
        body?.data ??
        body;

      const normalized = Array.isArray(products)
        ? products.map((item) => normalizeProduct(item)).filter(Boolean)
        : [];

      if (normalized.length > 0) {
        saveCatalogToCache(normalized);
      }

      return normalized.length > 0 ? normalized : (cached || []);
    } catch (error) {
      console.error("[fetchProducts] Admin catalog error:", error);
      return cached || [];
    } finally {
      inFlightCatalogPromise = null;
    }
  })();

  return inFlightCatalogPromise;
}
