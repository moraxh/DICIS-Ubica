import { NextResponse } from "next/server";
import { RoomService } from "@/backend/services/room.service";
import { secondsUntilNextHalfHour } from "@/backend/utils";

export function GET() {
  try {
    const response = RoomService.getRoomsWithState();

    const cacheSeconds = secondsUntilNextHalfHour();

    const headers =
      process.env.NODE_ENV === "development"
        ? {
            "Cache-Control": "no-store, max-age=0",
          }
        : {
            "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=60`,
          };

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Error fetching rooms state:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms state" },
      { status: 500 },
    );
  }
}
