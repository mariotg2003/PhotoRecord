import { useState, type FormEvent } from "react";
import { makeId, today, validDate } from "../data/domain";
import { compressImage } from "../data/images";
import { POINTS } from "../data/pointsService";
import { samples } from "../data/samples";
import type { Memory } from "../types";
import Modal from "./Modal";

export default function AddMemory({ onClose, onSave, busy, pointsEnabled = false }: { onClose: () => void; onSave: (memory: Memory) => Promise<void>; busy: boolean; pointsEnabled?: boolean }) {
  const [photo, setPhoto] = useState("");
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function selectFile(file?: File) {
    if (!file) return;
    setProcessing(true); setError("");
    try { setPhoto(await compressImage(file)); }
    catch (reason) { setError(`No se pudo procesar la foto: ${String(reason)}`); }
    finally { setProcessing(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!photo || !validDate(date) || !location.trim() || !note.trim()) {
      setError("Selecciona una foto y completa una fecha válida, ubicación y nota."); return;
    }
    setError("");
    try {
      await onSave({ id: makeId(), date, location: location.trim(), note: note.trim(), photo });
      onClose();
    } catch (reason) { setError(`No se pudo guardar el recuerdo: ${String(reason)}`); }
  }
  return <Modal title="Añadir recuerdo" subtitle="Los pequeños momentos también cuentan." onClose={onClose} busy={busy || processing}>
    <form className="pr-form" onSubmit={(event) => void submit(event)}>
      {error && <p className="pr-error" role="alert">{error}</p>}
      <label className="pr-upload">
        {photo ? <img src={photo} alt="Vista previa del recuerdo" /> : <span><b>⇧</b><strong>{processing ? "Preparando foto..." : "Elige una foto"}</strong><small>Desde tu dispositivo</small></span>}
        <input type="file" accept="image/*" aria-label="Elegir foto del dispositivo" disabled={processing || busy} onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = ""; }} />
      </label>
      {photo && <p className="pr-helper">Pulsa la foto para cambiarla.</p>}
      <div><p className="pr-label">O ELIGE UNA FOTO DE EJEMPLO</p><div className="pr-thumbnails">
        {samples.map((sample) => <button key={sample.label} type="button" aria-label={`Foto de ejemplo: ${sample.label}`} aria-pressed={photo === sample.uri} className={photo === sample.uri ? "pr-selected" : ""} onClick={() => setPhoto(sample.uri)}><img src={sample.uri} alt="" /></button>)}
      </div></div>
      <label className="pr-field">FECHA<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      <label className="pr-field">UBICACIÓN<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="¿Dónde ocurrió?" required /></label>
      <label className="pr-field">TU NOTA<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Escribe algo que quieras recordar..." required /></label>
      {pointsEnabled && <p className="pr-helper">🪙 Al guardar este recuerdo: +{POINTS.MEMORY} puntos compartidos.</p>}
      <button className="pr-button" disabled={busy || processing}>{busy ? "Guardando..." : "♡  Guardar recuerdo"}</button>
    </form>
  </Modal>;
}
