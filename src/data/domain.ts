import type { AlbumWithMemories, Memory, PhotoRecordState } from "../types";

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 100 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function monthKey(date: string): string {
  if (!validDate(date)) throw new Error("La fecha no es válida.");
  return date.slice(0, 7);
}

export function monthName(key: string): string {
  const [year, month] = key.split("-");
  return `${months[Number(month) - 1]} ${year}`;
}

export function addMemory(state: PhotoRecordState, memory: Memory): PhotoRecordState {
  const key = monthKey(memory.date);
  const album = state.albums[key] || {
    id: key, name: monthName(key), color: "rose" as const, emoji: "📷",
    description: "", favorite: false, coverId: memory.id
  };
  return { ...state, albums: { ...state.albums, [key]: album }, memories: [memory, ...state.memories] };
}

export function orderedAlbums(state: PhotoRecordState): AlbumWithMemories[] {
  return Object.values(state.albums).map((album) => ({
    ...album,
    memories: state.memories.filter((memory) => monthKey(memory.date) === album.id)
      .sort((a, b) => b.date.localeCompare(a.date))
  })).filter((album) => album.memories.length > 0).sort((a, b) =>
    Number(b.favorite) - Number(a.favorite) || b.memories[0].date.localeCompare(a.memories[0].date)
  );
}

export function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
