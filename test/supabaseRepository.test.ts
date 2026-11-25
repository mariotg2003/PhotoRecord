import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { albumFromRow, albumToRow, createSupabaseRepository } from "../src/data/supabaseRepository";

function fakeClient() {
  const insert = vi.fn(async () => ({ error: null }));
  const upsert = vi.fn(async () => ({ error: null }));
  const upload = vi.fn(async () => ({ error: null }));
  const client = {
    from: (table: string) => table === "memories" ? { insert } : { upsert },
    storage: { from: () => ({ upload, remove: vi.fn() }) }
  } as unknown as SupabaseClient;
  return { client, insert, upsert, upload };
}

describe("repositorio Supabase", () => {
  it("convierte álbumes sin perder la portada", () => {
    const album = { id: "2025-03", name: "Marzo 2025", color: "rose" as const, emoji: "📷", description: "", favorite: true, coverId: "" };
    expect(albumFromRow(albumToRow(album))).toEqual(album);
  });

  it("sube las fotos nuevas a Storage y guarda solo la ruta", async () => {
    const { client, insert, upload } = fakeClient();
    const repo = createSupabaseRepository(client);
    const memory = { id: "11111111-1111-4111-8111-111111111111", date: "2025-03-08", location: "Playa", note: "Hola", photo: "data:image/webp;base64,AAAA" };
    await repo.save({ albums: {}, memories: [memory] });
    expect(upload).toHaveBeenCalledWith(`${memory.id}.webp`, expect.anything(), expect.objectContaining({ contentType: "image/webp" }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ photo_path: `${memory.id}.webp`, photo_url: null }));
    await repo.save({ albums: {}, memories: [memory] });
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
