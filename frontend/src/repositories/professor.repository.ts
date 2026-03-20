import { db } from "@/db";
import { Professor } from "@/models/professor.model";
import { Result } from "@/types";

export class ProfessorRepository {
  static getProfessorById(id: string): Result<Professor> {
    const professor = db.professors.find((prof) => prof.id === id);
    if (!professor) {
      return { success: false, error: "Professor not found" };
    }
    return {
      success: true,
      data: new Professor(id, professor.name, professor.honorific),
    };
  }

  static getAllProfessors(): Professor[] {
    return Object.entries(db.professors).map(
      ([id, prof]) => new Professor(id, prof.name, prof.honorific),
    );
  }
}
