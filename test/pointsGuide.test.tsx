import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AddMemory from "../src/components/AddMemory";
import CollageEditor from "../src/components/CollageEditor";
import { PointsGuide } from "../src/components/PointsBadgeHeader";

const callbacks = { onClose: () => {}, onSave: async () => {}, busy: false };

describe("información de puntos", () => {
  it("explica las acciones, condiciones y un ejemplo de combinación", () => {
    const guide = renderToStaticMarkup(<PointsGuide />);
    expect(guide).toContain("+10 pts");
    expect(guide).toContain("+15 pts");
    expect(guide).toContain("+20 pts");
    expect(guide).toContain("entre 2 y 4");
    expect(guide).toContain("35 puntos");
    expect(guide).toContain("Organizar álbumes o crear recompensas no da puntos");
  });

  it("solo anuncia puntos en los formularios cuando están disponibles", () => {
    expect(renderToStaticMarkup(<AddMemory {...callbacks} pointsEnabled />)).toContain("+10 puntos compartidos");
    expect(renderToStaticMarkup(<CollageEditor {...callbacks} memories={[]} pointsEnabled />)).toContain("+15 puntos compartidos");
    expect(renderToStaticMarkup(<AddMemory {...callbacks} />)).not.toContain("puntos compartidos");
    expect(renderToStaticMarkup(<CollageEditor {...callbacks} memories={[]} />)).not.toContain("puntos compartidos");
  });
});
