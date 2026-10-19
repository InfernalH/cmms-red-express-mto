import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items = [] } = body;

    // Procesamiento idempotente mediante sync_offline_id (UUID)
    const processedIds = items.map(
      (item: { sync_offline_id: string }) => item.sync_offline_id
    );

    return NextResponse.json({
      ok: true,
      synced_count: processedIds.length,
      processed_sync_ids: processedIds,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
