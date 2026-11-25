import type { Collage, PhotoRecordState } from "../types";
import { validDate } from "./domain";

const KEY = "@photorecord/v1";

export interface PhotoRecordRepository {
  load(): Promise<PhotoRecordState>;
  save(data: PhotoRecordState): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isState(value: unknown): value is PhotoRecordState {
  if (!isRecord(value) || !isRecord(value.albums) || !Array.isArray(value.memories)) return false;
  return Object.values(value.albums).every((album) => isRecord(album) &&
    typeof album.id === "string" && typeof album.name === "string" && typeof album.color === "string" &&
    ["rose", "sky", "amber", "violet", "emerald", "slate"].includes(album.color) &&
    typeof album.emoji === "string" && typeof album.description === "string" &&
    typeof album.favorite === "boolean" && typeof album.coverId === "string") &&
    value.memories.every((memory: unknown) => isRecord(memory) && typeof memory.id === "string" &&
      typeof memory.date === "string" && validDate(memory.date) && typeof memory.location === "string" &&
      typeof memory.note === "string" && (typeof memory.photo === "string" || isCollage(memory.collage)) &&
      (memory.collage === undefined || isCollage(memory.collage)));
}

function isCollage(value: unknown): value is Collage {
  return isRecord(value) && Array.isArray(value.photoIds) && value.photoIds.every((id: unknown) => typeof id === "string") &&
    typeof value.layout === "string" && ["grid", "vertical", "horizontal", "magazine", "polaroid", "scrapbook"].includes(value.layout) &&
    typeof value.text === "string" && typeof value.font === "string" && ["handwriting", "sans", "serif"].includes(value.font) &&
    typeof value.align === "string" && ["left", "center", "right"].includes(value.align) && typeof value.textColor === "string" && typeof value.fontSize === "number" &&
    typeof value.background === "string" && typeof value.pattern === "string" && ["none", "hearts", "stars", "dots"].includes(value.pattern) && typeof value.gap === "number" &&
    typeof value.radius === "number" && typeof value.frame === "string";
}

export const repository: PhotoRecordRepository = {
  async load() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return { albums: {}, memories: [] };
    const data: unknown = JSON.parse(raw);
    if (!isState(data)) throw new Error("Los datos guardados no tienen un formato válido.");
    return data;
  },
  async save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
};
