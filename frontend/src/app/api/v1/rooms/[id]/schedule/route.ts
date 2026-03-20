import { RoomService } from "@/services/room.service";
import { secondsUntilNextHalfHour } from "@/utils";
import { NextResponse } from "next/server";

export function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = RoomService.getRoomSchedule(params.id);

    if (!response) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const cacheSeconds = secondsUntilNextHalfHour();

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    console.error("Error fetching room schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch room schedule" },
      { status: 500 },
    );
  }
}
