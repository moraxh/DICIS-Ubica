import { Class } from "./models/class.model";
import { Professor } from "./models/professor.model";
import { Room } from "./models/room.model";
import { Subject } from "./models/subject.model";

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const DaysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export interface DBObject {
  subjects: Subject[];
  professors: Professor[];
  rooms: Room[];
  classes: Class[];
}

export interface ClassWithDetails extends Omit<
  Class,
  "subjectId" | "professorId" | "roomId"
> {
  subject: Subject;
  professor: Professor;
  room: Room;
}
