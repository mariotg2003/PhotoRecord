import type { Collage, Memory } from "../types";

function CollageImage({ collage, memories }: { collage: Collage; memories: Memory[] }) {
  const photos = collage.photoIds.map((id) => memories.find((item) => item.id === id)).filter((item): item is Memory => Boolean(item?.photo));
  return <div className={`pr-collage pr-collage--${collage.layout}`} style={{
    backgroundColor: collage.background, padding: collage.gap, gap: collage.gap
  }}>
    <div className="pr-collage-grid" style={{
      gap: collage.gap,
      gridTemplateRows: collage.layout === "magazine" ? `repeat(${Math.max(1, photos.length - 1)}, minmax(0, 1fr))` : undefined
    }}>
      {photos.map((memory) => <div key={memory.id} className="pr-collage-cell" style={{
        borderRadius: collage.radius, backgroundColor: collage.frame
      }}><img src={memory.photo} alt="" style={{ borderRadius: collage.radius }} /></div>)}
    </div>
    {collage.pattern !== "none" && <span className="pr-pattern" aria-hidden="true">{collage.pattern === "hearts" ? "♥   ♥   ♥" : collage.pattern === "stars" ? "✦   ✦   ✦" : "•   •   •"}</span>}
    {collage.text && <span className={`pr-collage-text pr-font--${collage.font}`} style={{
      color: collage.textColor, fontSize: collage.fontSize, textAlign: collage.align
    }}>{collage.text}</span>}
  </div>;
}

export default function MemoryImage({ memory, memories, className = "" }: { memory?: Memory; memories: Memory[]; className?: string }) {
  return <div className={`pr-memory-image ${className}`}>
    {memory?.collage ? <CollageImage collage={memory.collage} memories={memories} /> :
      memory?.photo ? <img src={memory.photo} alt="" /> : null}
  </div>;
}

export { CollageImage };
