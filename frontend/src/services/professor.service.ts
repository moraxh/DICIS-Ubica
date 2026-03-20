import { Professor } from "@/models/professor.model";
import { ClassRepository } from "@/repositories/class.repository";
import { ProfessorRepository } from "@/repositories/professor.repository";
import { ClassWithDetails, DaysOfWeek } from "@/types";
import { isClassNow } from "@/utils";

interface OccupiedProfessor extends Professor {
  actualClass: ClassWithDetails;
}

interface ProfessorsWithState {
  freeProfessors: Professor[];
  occupiedProfessors: OccupiedProfessor[];
}

interface ProfessorWithSchedule {
  professor: Professor;
  classes: ClassWithDetails[];
}

export class ProfessorService {
  static getProfessorsWithState(): ProfessorsWithState {
    const todayName = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();

    if (!(todayName in DaysOfWeek)) {
      throw new Error(`Invalid day of week: ${todayName}`);
    }

    const todayDayOfWeek = todayName as (typeof DaysOfWeek)[number];
    const todayClasses = ClassRepository.getClassesByDay(todayDayOfWeek);

    const allProfessors = ProfessorRepository.getAllProfessors();
    const hydratedClasses = ClassRepository.hydrateClasses(todayClasses);

    const classesNow = hydratedClasses.filter((cls) => isClassNow(cls));

    const occupiedProfessors: OccupiedProfessor[] = classesNow.map((cls) => ({
      ...cls.professor,
      actualClass: cls,
    }));

    const occupiedProfessorIds = new Set(occupiedProfessors.map((p) => p.id));

    const freeProfessors = allProfessors.filter(
      (prof) => !occupiedProfessorIds.has(prof.id),
    );

    return {
      freeProfessors,
      occupiedProfessors,
    };
  }

  static getProfessorSchedule(
    professorId: string,
  ): ProfessorWithSchedule | null {
    const professorResult = ProfessorRepository.getProfessorById(professorId);
    if (!professorResult.success) {
      console.error(`Professor not found: ${professorId}`);
      return null;
    }

    const classes = ClassRepository.getClassesByProfessor(professorId);
    const hydratedClasses = ClassRepository.hydrateClasses(classes);

    return {
      professor: professorResult.data,
      classes: hydratedClasses,
    };
  }
}
