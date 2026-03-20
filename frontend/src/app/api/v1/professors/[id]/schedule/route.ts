import { ProfessorService } from "@/services/professor.service";
import { NextResponse } from "next/server";

export function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = ProfessorService.getProfessorSchedule(params.id);

    if (!response) {
      return NextResponse.json(
        { error: "Professor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching professor schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch professor schedule" },
      { status: 500 },
    );
  }
}
