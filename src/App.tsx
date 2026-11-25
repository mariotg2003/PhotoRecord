import { useEffect, useMemo, useRef, useState } from "react";
import AddMemory from "./components/AddMemory";
import CollageEditor from "./components/CollageEditor";
import MemoryImage from "./components/MemoryImage";
import Modal from "./components/Modal";
import OrganizeAlbum from "./components/OrganizeAlbum";
import { addMemory, monthName, orderedAlbums } from "./data/domain";
import { repository, type PhotoRecordRepository } from "./data/repository";
import { samples } from "./data/samples";
import type { Album, AlbumWithMemories, Memory, PhotoRecordState } from "./types";

const emptyState: PhotoRecordState = { albums: {}, memories: [] };

export default function App({ storage = repository, onSignOut }: { storage?: PhotoRecordRepository; onSignOut?: () => void }) {
  const [data, setData] = useState<PhotoRecordState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [screen, setScreen] = useState<"home" | "albums">("home");
  const [modal, setModal] = useState<"add" | "collage" | null>(null);
  const [detail, setDetail] = useState<Memory | null>(null);
  const [editing, setEditing] = useState<AlbumWithMemories | null>(null);
  const albums = useMemo(() => orderedAlbums(data), [data]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    storage.load().then((value) => { if (active) setData(value); })
      .catch((reason: unknown) => { if (active) setLoadError(`No se pudieron cargar tus recuerdos: ${String(reason)}`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [storage]);

  async function persist(next: PhotoRecordState) {
    if (saving.current) throw new Error("Ya hay un guardado en curso.");
    saving.current = true; setBusy(true);
    try { await storage.save(next); setData(next); }
    finally { saving.current = false; setBusy(false); }
  }
  async function saveMemory(memory: Memory) { await persist(addMemory(data, memory)); }
  async function saveAlbum(album: Album) { await persist({ ...data, albums: { ...data.albums, [album.id]: album } }); }
  const ready = !loading && !loadError;

  return <div className="photorecord">
    <div className="pr-app">
      <header className="pr-header">
        <div className="pr-brand-icon" aria-hidden="true">▣</div>
        <div className="pr-brand"><strong>PhotoRecord</strong><small>TU DIARIO DE MOMENTOS</small></div>
        <button type="button" className="pr-icon-button" aria-label="Crear collage" disabled={!ready} onClick={() => setModal("collage")}>✧</button>
        {onSignOut && <button type="button" className="pr-icon-button" aria-label="Cerrar sesión" onClick={onSignOut}>⏻</button>}
      </header>
      <main className="pr-content">
        <div className="pr-content-inner">
        {loading ? <p className="pr-helper pr-status">Cargando tus recuerdos...</p> : loadError ?
          <div className="pr-status"><p className="pr-error" role="alert">{loadError}</p><p className="pr-helper">No se modificarán los datos existentes. Reinicia la aplicación para volver a intentarlo.</p></div> : <>
            {screen === "home" && <>
              <div className="pr-home">
                <div className="pr-home-copy">
                  <p className="pr-eyebrow"><span /> TU RINCÓN ESPECIAL</p>
                  <h1 className="pr-heading">La vida está hecha<br />de <em>momentos.</em></h1>
                  <p className="pr-intro">Guarda las pequeñas historias que merecen quedarse contigo para siempre.</p>
                </div>
                <div className="pr-hero">
                  <div className="pr-hero-content"><small>UN LUGAR PARA RECORDAR</small><h2>Cada foto,<br />una historia ♡</h2><p>Colecciona lo bonito de cada día.</p><button type="button" onClick={() => setModal("add")}>Crear recuerdo <span>→</span></button></div>
                  <div className="pr-hero-image"><img src={samples[0].uri} alt="" /></div>
                </div>
              </div>
              <div className="pr-stats"><div><strong>{data.memories.length}</strong><small>RECUERDOS</small></div><div><strong>{albums.length}</strong><small>ÁLBUMES</small></div><div><strong>∞</strong><small>MOMENTOS</small></div></div>
            </>}
            <div className="pr-section-heading"><div><small>{screen === "home" ? "TUS HISTORIAS" : "HECHO CON CARIÑO"}</small><h2>{screen === "home" ? "Tus álbumes" : "Tu colección"}</h2></div><span>{albums.length} {albums.length === 1 ? "álbum" : "álbumes"}</span></div>
            <div className="pr-album-list">{albums.length === 0 ? <div className="pr-empty"><div className="pr-empty-icon">▧</div><h3>Aquí empieza tu historia</h3><p>Todavía no tienes recuerdos. Añade tu primera foto y guarda ese momento especial.</p><button className="pr-button" onClick={() => setModal("add")}>＋ Añadir mi primer recuerdo</button></div> :
              albums.map((album) => {
                const cover = data.memories.find((memory) => memory.id === album.coverId) || album.memories[0];
                return <article className="pr-album" key={album.id}>
                  <div className={`pr-album-header pr-theme--${album.color}`}>
                    <MemoryImage className="pr-album-cover" memory={cover} memories={data.memories} />
                    <div className="pr-album-info"><h3>{album.emoji} {album.name} {album.favorite && <span title="Destacado">★</span>}</h3><p>{album.description || `${album.memories.length} ${album.memories.length === 1 ? "recuerdo guardado" : "recuerdos guardados"}`}</p></div>
                    <button className="pr-icon-button" aria-label={`Organizar ${album.name}`} onClick={() => setEditing(album)}>···</button>
                  </div>
                  <div className="pr-memory-grid">{album.memories.map((memory) => <button type="button" className="pr-memory-tile" key={memory.id} aria-label={`Abrir recuerdo ${memory.location}`} onClick={() => setDetail(memory)}>
                    <MemoryImage memory={memory} memories={data.memories} /><span>{memory.location}</span>{memory.collage && <b aria-label="Collage">▦</b>}
                  </button>)}</div>
                </article>;
              })}</div>
            <p className="pr-bottom-note">♥ &nbsp; HECHO PARA RECORDAR &nbsp; ♥</p>
          </>}
        </div>
      </main>
      <nav className="pr-nav" aria-label="Navegación principal">
        <button type="button" className={screen === "home" ? "pr-active" : ""} aria-current={screen === "home" ? "page" : undefined} onClick={() => setScreen("home")}><span>⌂</span>Inicio</button>
        <button type="button" className="pr-nav-add" aria-label="Añadir recuerdo" disabled={!ready} onClick={() => setModal("add")}><span className="pr-nav-add-symbol" aria-hidden="true">＋</span><span className="pr-nav-add-label" aria-hidden="true">Añadir recuerdo</span></button>
        <button type="button" className={screen === "albums" ? "pr-active" : ""} aria-current={screen === "albums" ? "page" : undefined} onClick={() => setScreen("albums")}><span>▤</span>Álbumes</button>
      </nav>
      {modal === "add" && <AddMemory busy={busy} onClose={() => setModal(null)} onSave={saveMemory} />}
      {modal === "collage" && <CollageEditor busy={busy} onClose={() => setModal(null)} memories={data.memories} onSave={saveMemory} />}
      {editing && <OrganizeAlbum album={editing} memories={data.memories} busy={busy} onClose={() => setEditing(null)} onSave={saveAlbum} />}
      {detail && <Modal title="Un momento especial" subtitle={monthName(detail.date.slice(0, 7))} onClose={() => setDetail(null)}>
        <div className="pr-detail"><MemoryImage memory={detail} memories={data.memories} className="pr-detail-image" /><h3>⌖ {detail.location}</h3><p className="pr-helper">{detail.date.split("-").reverse().join(" / ")}</p><p>{detail.note}</p></div>
      </Modal>}
    </div>
  </div>;
}
