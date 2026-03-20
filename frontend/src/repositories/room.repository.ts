import { db } from "@/db";
import { Room } from "@/models/room.model";
import { Result } from "@/types";

export class RoomRepository {
  static getRoomById(id: string): Result<Room> {
    const room = db.rooms.find((r) => r.id === id);
    if (!room) {
      return { success: false, error: "Room not found" };
    }
    return {
      success: true,
      data: new Room(id, room.name),
    };
  }

  static getAllRooms(): Room[] {
    return Object.entries(db.rooms).map(
      ([id, room]) => new Room(id, room.name),
    );
  }
}
