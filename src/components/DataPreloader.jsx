"use client";

import { useEffect } from "react";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";
import { db, doc, getDoc } from "@/lib/client-api";

export default function DataPreloader() {
  useEffect(() => {
    const preload = () => {
      // Warm up catalog and key pages
      try {
        fetchAllDynamicProducts().catch(() => {});
        getDoc(doc(db, "websites", "diagnotexcom", "pages", "contact")).catch(() => {});
        getDoc(doc(db, "websites", "diagnotexcom", "pages", "services")).catch(() => {});
      } catch {
        // Ignore background preload errors
      }
    };

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(preload);
      } else {
        setTimeout(preload, 100);
      }
    }
  }, []);

  return null;
}
