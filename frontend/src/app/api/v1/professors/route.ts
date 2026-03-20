import { ProfessorService } from "@/services/professor.service";
import { NextResponse } from "next/server";

export function GET() {
  try {
    const response = ProfessorService.getProfessorsWithState();
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching professors state:", error);
    return NextResponse.json(
      { error: "Failed to fetch professors state" },
      { status: 500 },
    );
  }
}
