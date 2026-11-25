import { describe, expect, it } from "vitest";
import { addMemory, monthKey, monthName, orderedAlbums, validDate } from "../src/data/domain";
import type { PhotoRecordState } from "../src/types";

describe("recuerdos y álbumes", () => {
  it("valida las fechas y agrupa por mes", () => {
    expect(validDate("2024-02-29")).toBe(true);
    expect(validDate("2025-02-29")).toBe(false);
    expect(validDate("2025-13-01")).toBe(false);
    expect(() => monthKey("2025-02-29")).toThrow();
    expect(monthName(monthKey("2025-03-08"))).toBe("Marzo 2025");
  });

  it("conserva los ajustes y ordena los favoritos y sus recuerdos", () => {
    let state: PhotoRecordState = { albums: {}, memories: [] };
    state = addMemory(state, { id: "a", date: "2025-02-01", location: "", note: "", photo: "a" });
    state.albums["2025-02"].favorite = true;
    state = addMemory(state, { id: "b", date: "2025-03-01", location: "", note: "", photo: "b" });
    state = addMemory(state, { id: "c", date: "2025-02-25", location: "", note: "", photo: "c" });
    const albums = orderedAlbums(state);
    expect(albums[0].id).toBe("2025-02");
    expect(albums[0].memories.map((item) => item.id)).toEqual(["c", "a"]);
    expect(albums[0].coverId).toBe("a");
  });
});
