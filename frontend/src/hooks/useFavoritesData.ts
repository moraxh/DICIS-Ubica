import { useMemo } from "react";
import type { Professor } from "@/backend/models/professor.model";
import type { Room } from "@/backend/models/room.model";
import { useProfessors } from "@/context/Professor/useProfessors";
import { useRooms } from "@/context/Rooms/useRooms";
import { useFavorites } from "./useFavorites";

interface FavoriteData {
  rooms: Room[];
  professors: Professor[];
  isLoading: boolean;
}

export function useFavoritesData(): FavoriteData {
  const { favorites } = useFavorites();
  const { roomsWithState, isLoading: roomsLoading } = useRooms();
  const { professorsWithState, isLoading: profsLoading } = useProfessors();

  const favoritesData = useMemo(() => {
    // Collect all rooms
    const allRooms = [
      ...roomsWithState.freeRooms.map((r) => r.room),
      ...roomsWithState.occupiedRooms.map((r) => r.room),
    ];

    // Collect all professors
    const allProfessors = [
      ...professorsWithState.freeProfessors.map((p) => p.professor),
      ...professorsWithState.occupiedProfessors.map((p) => p.professor),
    ];

    const favoriteRooms = allRooms.filter((room) => favorites.has(room.id));
    const favoriteProfessors = allProfessors.filter((prof) =>
      favorites.has(prof.id),
    );

    return {
      rooms: favoriteRooms,
      professors: favoriteProfessors,
      isLoading: roomsLoading || profsLoading,
    };
  }, [
    favorites,
    roomsWithState,
    professorsWithState,
    roomsLoading,
    profsLoading,
  ]);

  return favoritesData;
}
