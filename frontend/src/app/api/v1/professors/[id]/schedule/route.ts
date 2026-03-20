import { NextResponse } from "next/server";
import { ProfessorService } from "@/backend/services/professor.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const response = ProfessorService.getProfessorSchedule(id);

    if (!response) {
      return NextResponse.json(
        { error: "Professor not found" },
        { status: 404 },
      );
    }

    const headers: Record<string, string> =
      process.env.NODE_ENV === "development"
        ? {
            "Cache-Control": "no-store, max-age=0",
          }
        : {};

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Error fetching professor schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch professor schedule" },
      { status: 500 },
    );
  }
}
