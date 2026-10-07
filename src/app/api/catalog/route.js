import { NextResponse } from "next/server";
import { fetchFullCatalog } from "@/lib/data-fetcher-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const headers = {
  "Cache-Control": "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
};

export async function GET() {
  try {
    return NextResponse.json(
      { products: await fetchFullCatalog() },
      { headers }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Catalog request failed" },
      { status: 500, headers }
    );
  }
}
