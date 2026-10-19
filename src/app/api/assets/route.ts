import { NextRequest, NextResponse } from "next/server";
import { INITIAL_ASSETS, INITIAL_STORES, INITIAL_ZONES, INITIAL_ASSET_TYPES } from "@/lib/initial-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qrUuid = searchParams.get("qr");
  const storeId = searchParams.get("store_id");

  let assets = [...INITIAL_ASSETS];

  if (qrUuid) {
    assets = assets.filter(
      (a) =>
        a.qr_code_uuid.toLowerCase() === qrUuid.toLowerCase() ||
        a.tag_code.toLowerCase() === qrUuid.toLowerCase()
    );
  }
  if (storeId) {
    assets = assets.filter((a) => a.store_id === Number(storeId));
  }

  return NextResponse.json({
    ok: true,
    total_network_stores: 528,
    zones: INITIAL_ZONES,
    stores: INITIAL_STORES,
    asset_types: INITIAL_ASSET_TYPES,
    assets,
  });
}
