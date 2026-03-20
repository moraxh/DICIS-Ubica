import { db } from "@/db";
import { Class } from "@/models/class.model";
import { ClassWithDetails, DaysOfWeek, Result } from "@/types";
import { SubjectRepository } from "./subject.repository";
import { ProfessorRepository } from "./professor.repository";
import { RoomRepository } from "./room.repository";

export class ClassRepository {
  static getClassesByRoomId(roomId: string): Class[] {
    const classes = db.classes.filter((cls) => cls.roomId === roomId);
    return classes;
  }

  static getClassesByDay(day: (typeof DaysOfWeek)[number]): Class[] {
    const classes = db.classes.filter((cls) => cls.day === day);
    return classes;
  }

  static getClassesByProfessor(professorId: string): Class[] {
    const classes = db.classes.filter((cls) => cls.professorId === professorId);
    return classes;
  }

  static hydrateClasses(classes: Class[]): ClassWithDetails[] {
    return classes.flatMap((cls) => {
      const result = this.hydrateClass(cls);
      if (!result.success) {
        console.error(`Failed to hydrate class ${cls}: ${result.error}`);
        return [];
      }
      return [result.data];
    });
  }

  static hydrateClass(cls: Class): Result<ClassWithDetails> {
    const subjectResult = SubjectRepository.getSubjectById(cls.subjectId);
    if (!subjectResult.success) {
      return { success: false, error: subjectResult.error };
    }

    const professorResult = ProfessorRepository.getProfessorById(
      cls.professorId,
    );
    if (!professorResult.success) {
      return { success: false, error: professorResult.error };
    }

    const roomResult = RoomRepository.getRoomById(cls.roomId);
    if (!roomResult.success) {
      return { success: false, error: roomResult.error };
    }

    return {
      success: true,
      data: {
        room: roomResult.data,
        professor: professorResult.data,
        subject: subjectResult.data,
        day: cls.day,
        start: cls.start,
        end: cls.end,
      },
    };
  }
}
