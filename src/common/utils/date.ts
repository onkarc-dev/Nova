export function nowUtc(): Date {
  return new Date();
}

export function toIsoDate(value: Date): string {
  return value.toISOString();
}

export function addSeconds(value: Date, seconds: number): Date {
  return new Date(value.getTime() + seconds * 1000);
}
