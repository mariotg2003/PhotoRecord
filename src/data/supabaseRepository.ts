import type { SupabaseClient } from "@supabase/supabase-js";
import type { Album, Collage, Memory, PhotoRecordState } from "../types";
import type { PhotoRecordRepository } from "./repository";

const BUCKET = "photos";
const URL_TTL_SECONDS = 60 * 60 * 24;

export interface AlbumRow { id: string; name: string; color: Album["color"]; emoji: string; description: string; favorite: boolean; cover_id: string | null }
export interface MemoryRow { id: string; date: string; location: string; note: string; photo_path: string | null; photo_url: string | null; collage: Collage | null }

export const albumFromRow = (row: AlbumRow): Album => ({
  id: row.id, name: row.name, color: row.color, emoji: row.emoji, description: row.description,
  favorite: row.favorite, coverId: row.cover_id ?? ""
});
export const albumToRow = (album: Album): AlbumRow => ({
  id: album.id, name: album.name, color: album.color, emoji: album.emoji, description: album.description,
  favorite: album.favorite, cover_id: album.coverId || null
});

function fail(action: string, error: { message: string } | null) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export function createSupabaseRepository(client: SupabaseClient): PhotoRecordRepository {
  const known = new Set<string>();
  const pathByUrl = new Map<string, string>();

  async function upload(id: string, dataUrl: string): Promise<string> {
    const blob = await (await fetch(dataUrl)).blob();
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}.${extension}`;
    const { error } = await client.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
    fail("No se pudo subir la foto", error);
    return path;
  }

  return {
    async load() {
      const [albumsResult, memoriesResult] = await Promise.all([
        client.from("albums").select("*"),
        client.from("memories").select("*").order("date", { ascending: false })
      ]);
      fail("No se pudieron leer los álbumes", albumsResult.error);
      fail("No se pudieron leer los recuerdos", memoriesResult.error);
      const rows = (memoriesResult.data ?? []) as MemoryRow[];
      const paths = rows.flatMap((row) => row.photo_path ? [row.photo_path] : []);
      const urls = new Map<string, string>();
      if (paths.length) {
        const { data, error } = await client.storage.from(BUCKET).createSignedUrls(paths, URL_TTL_SECONDS);
        fail("No se pudieron preparar las fotos", error);
        for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
      }
      known.clear(); pathByUrl.clear();
      const memories: Memory[] = rows.map((row) => {
        known.add(row.id);
        let photo: string | undefined;
        if (row.photo_path) {
          photo = urls.get(row.photo_path);
          if (photo) pathByUrl.set(photo, row.photo_path);
        } else if (row.photo_url) photo = row.photo_url;
        return { id: row.id, date: row.date, location: row.location, note: row.note, photo, collage: row.collage ?? undefined };
      });
      const albums: Record<string, Album> = {};
      for (const row of (albumsResult.data ?? []) as AlbumRow[]) albums[row.id] = albumFromRow(row);
      return { albums, memories };
    },

    async save(state: PhotoRecordState) {
      for (const memory of state.memories.filter((item) => !known.has(item.id))) {
        let photoPath: string | null = null;
        let photoUrl: string | null = null;
        if (memory.photo?.startsWith("data:")) photoPath = await upload(memory.id, memory.photo);
        else if (memory.photo) photoUrl = memory.photo;
        const { error } = await client.from("memories").insert({
          id: memory.id, date: memory.date, location: memory.location, note: memory.note,
          photo_path: photoPath, photo_url: photoUrl, collage: memory.collage ?? null
        });
        if (error) {
          if (photoPath) await client.storage.from(BUCKET).remove([photoPath]);
          fail("No se pudo guardar el recuerdo", error);
        }
        known.add(memory.id);
      }
      const albums = Object.values(state.albums).map(albumToRow);
      if (albums.length) fail("No se pudieron guardar los álbumes", (await client.from("albums").upsert(albums)).error);
    }
  };
}
