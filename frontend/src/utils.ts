import { ClassWithDetails } from "./types";

export function secondsUntilNextHalfHour(): number {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  let secondsUntilNextHalfHour;

  if (minutes < 30) {
    secondsUntilNextHalfHour = (29 - minutes) * 60 + (60 - seconds);
  } else {
    secondsUntilNextHalfHour = (59 - minutes) * 60 + (60 - seconds);
  }

  return secondsUntilNextHalfHour;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isClassNow(cls: ClassWithDetails): boolean {
  const now = new Date();
  const currentMinutes = timeToMinutes(
    `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
  );

  const startMinutes = timeToMinutes(cls.start);
  const endMinutes = timeToMinutes(cls.end);

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}
