import { Room } from "@/models/room.model";
import { ClassRepository } from "@/repositories/class.repository";
import { RoomRepository } from "@/repositories/room.repository";
import { ClassWithDetails, DaysOfWeek } from "@/types";
import { isClassNow } from "@/utils";

interface RoomsWithState {
  freeRooms: Room[];
  occupiedRooms: ClassWithDetails[];
}

interface RoomWithSchedule {
  room: Room;
  classes: ClassWithDetails[];
}

export class RoomService {
  static getRoomsWithState(): RoomsWithState {
    const todayName = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();

    if (!(todayName in DaysOfWeek)) {
      throw new Error(`Invalid day of week: ${todayName}`);
    }

    const todayDayOfWeek = todayName as (typeof DaysOfWeek)[number];
    const todayClasses = ClassRepository.getClassesByDay(todayDayOfWeek);

    const allRooms = RoomRepository.getAllRooms();

    const hydratedClasses = ClassRepository.hydrateClasses(todayClasses);

    const classesNow = hydratedClasses.filter((cls) => isClassNow(cls));

    const occupiedRoomIds = new Set(classesNow.map((cls) => cls.room.id));
    const freeRooms = allRooms.filter((room) => !occupiedRoomIds.has(room.id));

    return {
      freeRooms,
      occupiedRooms: classesNow,
    };
  }

  static getRoomSchedule(roomId: string): RoomWithSchedule | null {
    const room = RoomRepository.getRoomById(roomId);
    if (!room.success) {
      console.error(`Room not found: ${roomId}`);
      return null;
    }

    const classes = ClassRepository.getClassesByRoomId(roomId);
    const hydratedClasses = ClassRepository.hydrateClasses(classes);

    return {
      room: room.data,
      classes: hydratedClasses,
    };
  }
}
