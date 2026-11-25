import { useState, type FormEvent } from "react";
import type { Album, AlbumColor, AlbumWithMemories, Memory } from "../types";
import MemoryImage from "./MemoryImage";
import Modal from "./Modal";

const colors: [AlbumColor, string][] = [["rose", "Rosa"], ["sky", "Cielo"], ["amber", "Ámbar"], ["violet", "Lavanda"], ["emerald", "Menta"], ["slate", "Gris"]];

export default function OrganizeAlbum({ album, memories, onClose, onSave, busy }: {
  album: AlbumWithMemories; memories: Memory[]; onClose: () => void; onSave: (album: Album) => Promise<void>; busy: boolean;
}) {
  const [draft, setDraft] = useState<Album>(album);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) { setError("Escribe un nombre para el álbum."); return; }
    try {
      const { id, color, emoji, favorite, coverId } = draft;
      await onSave({ id, color, emoji, favorite, coverId, name: draft.name.trim(), description: draft.description.trim() });
      onClose();
    } catch (reason) { setError(`No se pudo guardar el álbum: ${String(reason)}`); }
  }
  return <Modal title="Organizar álbum" subtitle="Dale un toque personal a este capítulo." onClose={onClose} busy={busy}>
    <form className="pr-form" onSubmit={(event) => void submit(event)}>
      {error && <p className="pr-error" role="alert">{error}</p>}
      <label className="pr-field">NOMBRE DEL ÁLBUM<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
      <label className="pr-field">DESCRIPCIÓN<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Una pequeña descripción..." /></label>
      <label className="pr-field">COLOR<select value={draft.color} onChange={(event) => {
        const color = colors.find(([key]) => key === event.target.value)?.[0];
        if (color) setDraft({ ...draft, color });
      }}>{colors.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
      <label className="pr-field">ICONO<select value={draft.emoji} onChange={(event) => setDraft({ ...draft, emoji: event.target.value })}>{["📷", "❤️", "✈️", "🎄", "✨", "🌸"].map((emoji) => <option key={emoji}>{emoji}</option>)}</select></label>
      <div><p className="pr-label">FOTO DE PORTADA</p><div className="pr-thumbnails">
        {album.memories.map((memory) => <button key={memory.id} type="button" aria-label={`Elegir portada ${memory.location}`} aria-pressed={draft.coverId === memory.id} className={draft.coverId === memory.id ? "pr-selected" : ""} onClick={() => setDraft({ ...draft, coverId: memory.id })}><MemoryImage memory={memory} memories={memories} /></button>)}
      </div></div>
      <label className="pr-favorite"><span><strong>Destacar álbum</strong><small>Aparecerá primero en tu colección</small></span><input type="checkbox" checked={draft.favorite} onChange={(event) => setDraft({ ...draft, favorite: event.target.checked })} /></label>
      <button className="pr-button" disabled={busy}>{busy ? "Guardando..." : "Guardar cambios"}</button>
    </form>
  </Modal>;
}
