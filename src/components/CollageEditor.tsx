import { useState, type FormEvent } from "react";
import { makeId, today } from "../data/domain";
import { POINTS } from "../data/pointsService";
import type { Collage, CollageAlign, CollageFont, CollageLayout, CollagePattern, Memory } from "../types";
import { CollageImage } from "./MemoryImage";
import Modal from "./Modal";

const layouts: [CollageLayout, string][] = [["grid", "Cuadrícula"], ["vertical", "Vertical"], ["horizontal", "Horizontal"], ["magazine", "Revista"], ["polaroid", "Polaroid"], ["scrapbook", "Scrapbook"]];
const fonts: [CollageFont, string][] = [["handwriting", "Manuscrita"], ["sans", "Sans"], ["serif", "Serif"]];
const alignments: [CollageAlign, string][] = [["left", "Izquierda"], ["center", "Centro"], ["right", "Derecha"]];
const patterns: [CollagePattern, string][] = [["none", "Ninguno"], ["hearts", "Corazones"], ["stars", "Estrellas"], ["dots", "Puntos"]];
const backgrounds: [string, string][] = [["#f7dfe2", "Rosa"], ["#ffffff", "Blanco"], ["#e5e2f1", "Lavanda"], ["#dfeeea", "Menta"], ["#f9ead8", "Arena"], ["#504957", "Noche"]];

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return <label className="pr-field">{label}<select value={value} onChange={(event) => {
    const option = options.find(([key]) => key === event.target.value);
    if (option) onChange(option[0]);
  }}>{options.map(([key, title]) => <option value={key} key={key}>{title}</option>)}</select></label>;
}

export default function CollageEditor({ memories, onClose, onSave, busy, pointsEnabled = false }: { memories: Memory[]; onClose: () => void; onSave: (memory: Memory) => Promise<void>; busy: boolean; pointsEnabled?: boolean }) {
  const [config, setConfig] = useState<Collage>({
    photoIds: [], layout: "grid", text: "", font: "handwriting", align: "center",
    textColor: "#ffffff", fontSize: 22, background: "#f7dfe2", pattern: "none", gap: 8, radius: 8, frame: "#ffffff"
  });
  const [location, setLocation] = useState("Collage especial");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const photos = memories.filter((memory) => memory.photo);

  function toggle(id: string) {
    if (config.photoIds.includes(id)) {
      setConfig({ ...config, photoIds: config.photoIds.filter((item) => item !== id) }); setError("");
    } else if (config.photoIds.length < 4) {
      setConfig({ ...config, photoIds: [...config.photoIds, id] }); setError("");
    } else setError("Puedes seleccionar hasta cuatro fotos.");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (config.photoIds.length < 2) { setError("Selecciona al menos dos fotos."); return; }
    if (!location.trim()) { setError("Escribe una ubicación para el collage."); return; }
    try {
      await onSave({ id: makeId(), date: today(), location: location.trim(), note: note.trim() || config.text.trim() || `Collage con ${config.photoIds.length} recuerdos.`, collage: config });
      onClose();
    } catch (reason) { setError(`No se pudo guardar el collage: ${String(reason)}`); }
  }
  return <Modal title="Crear collage" subtitle="Junta tus momentos favoritos en uno solo." onClose={onClose} busy={busy}>
    <form className="pr-form" onSubmit={(event) => void submit(event)}>
      {error && <p className="pr-error" role="alert">{error}</p>}
      <div className="pr-preview-label"><span className="pr-label">VISTA PREVIA</span><span className="pr-helper">{config.photoIds.length} / 4 fotos</span></div>
      <div className="pr-collage-preview">{config.photoIds.length ? <CollageImage collage={config} memories={memories} /> : <p>Selecciona al menos dos fotos</p>}</div>
      <div><p className="pr-label">ELIGE ENTRE 2 Y 4 FOTOS</p>
        {photos.length < 2 && <p className="pr-helper">Añade al menos dos recuerdos con foto para crear un collage.</p>}
        <div className="pr-thumbnails">{photos.map((memory) => <button key={memory.id} type="button" aria-label={`Seleccionar ${memory.location}`} aria-pressed={config.photoIds.includes(memory.id)} className={config.photoIds.includes(memory.id) ? "pr-selected" : ""} onClick={() => toggle(memory.id)}>
          <img src={memory.photo} alt="" />{config.photoIds.includes(memory.id) && <span className="pr-selected-badge">{config.photoIds.indexOf(memory.id) + 1}</span>}
        </button>)}</div>
      </div>
      <Choice label="DISEÑO" options={layouts} value={config.layout} onChange={(layout) => setConfig({ ...config, layout })} />
      <label className="pr-field">TEXTO SOBRE LA FOTO<input value={config.text} onChange={(event) => setConfig({ ...config, text: event.target.value })} placeholder="Un momento para recordar..." /></label>
      <div className="pr-two-columns">
        <Choice label="TIPOGRAFÍA" options={fonts} value={config.font} onChange={(font) => setConfig({ ...config, font })} />
        <Choice label="ALINEACIÓN" options={alignments} value={config.align} onChange={(align) => setConfig({ ...config, align })} />
        <label className="pr-field">COLOR DEL TEXTO<input type="color" value={config.textColor} onChange={(event) => setConfig({ ...config, textColor: event.target.value })} /></label>
        <label className="pr-field">TAMAÑO: {config.fontSize}px<input type="range" min="14" max="36" value={config.fontSize} onChange={(event) => setConfig({ ...config, fontSize: Number(event.target.value) })} /></label>
        <Choice label="FONDO" options={backgrounds} value={config.background} onChange={(background) => setConfig({ ...config, background })} />
        <Choice label="PATRÓN" options={patterns} value={config.pattern} onChange={(pattern) => setConfig({ ...config, pattern })} />
        <label className="pr-field">ESPACIO: {config.gap}px<input type="range" min="0" max="24" value={config.gap} onChange={(event) => setConfig({ ...config, gap: Number(event.target.value) })} /></label>
        <label className="pr-field">BORDE: {config.radius}px<input type="range" min="0" max="28" value={config.radius} onChange={(event) => setConfig({ ...config, radius: Number(event.target.value) })} /></label>
        <label className="pr-field">MARCO POLAROID<input type="color" value={config.frame} onChange={(event) => setConfig({ ...config, frame: event.target.value })} /></label>
      </div>
      <label className="pr-field">UBICACIÓN<input value={location} onChange={(event) => setLocation(event.target.value)} required /></label>
      <label className="pr-field">NOTA<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Una nota para tu collage..." /></label>
      {pointsEnabled && <p className="pr-helper">🪙 Al guardar este collage: +{POINTS.COLLAGE} puntos compartidos (no se suman también los del recuerdo).</p>}
      <button className="pr-button" disabled={busy || config.photoIds.length < 2}>{busy ? "Guardando..." : "Guardar collage"}</button>
    </form>
  </Modal>;
}
