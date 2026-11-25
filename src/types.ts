export type AlbumColor = "rose" | "sky" | "amber" | "violet" | "emerald" | "slate";
export type CollageLayout = "grid" | "vertical" | "horizontal" | "magazine" | "polaroid" | "scrapbook";
export type CollageFont = "handwriting" | "sans" | "serif";
export type CollageAlign = "left" | "center" | "right";
export type CollagePattern = "none" | "hearts" | "stars" | "dots";

export interface Collage {
  photoIds: string[];
  layout: CollageLayout;
  text: string;
  font: CollageFont;
  align: CollageAlign;
  textColor: string;
  fontSize: number;
  background: string;
  pattern: CollagePattern;
  gap: number;
  radius: number;
  frame: string;
}

export interface Memory {
  id: string;
  date: string;
  location: string;
  note: string;
  photo?: string;
  collage?: Collage;
}

export interface Album {
  id: string;
  name: string;
  color: AlbumColor;
  emoji: string;
  description: string;
  favorite: boolean;
  coverId: string;
}

export interface PhotoRecordState {
  albums: Record<string, Album>;
  memories: Memory[];
}

export type AlbumWithMemories = Album & { memories: Memory[] };
