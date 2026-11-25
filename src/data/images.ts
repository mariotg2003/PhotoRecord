export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Selecciona un archivo de imagen.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.75);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.7);
  } finally {
    URL.revokeObjectURL(url);
  }
}
