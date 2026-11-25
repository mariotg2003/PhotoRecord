import { afterEach, describe, expect, it, vi } from "vitest";
import { repository } from "../src/data/repository";

afterEach(() => vi.unstubAllGlobals());

describe("repositorio local", () => {
  it("lee el formato web usado por la versión anterior", async () => {
    const data = {
      albums: { "2025-03": { id: "2025-03", name: "Marzo 2025", color: "rose", emoji: "📷", description: "", favorite: false, coverId: "a" } },
      memories: [{ id: "a", date: "2025-03-08", location: "Playa", note: "Un recuerdo", photo: "data:image/jpeg;base64,abc" }]
    };
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => JSON.stringify(data)) });
    await expect(repository.load()).resolves.toEqual(data);
    expect(localStorage.getItem).toHaveBeenCalledWith("@photorecord/v1");
  });

  it("rechaza datos dañados sin sobrescribirlos", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => '{"albums":{},"memories":[{"date":"incorrecta"}]}'), setItem });
    await expect(repository.load()).rejects.toThrow("formato válido");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("propaga errores al guardar", async () => {
    vi.stubGlobal("localStorage", { setItem: vi.fn(() => { throw new Error("cuota"); }) });
    await expect(repository.save({ albums: {}, memories: [] })).rejects.toThrow("cuota");
  });
});
