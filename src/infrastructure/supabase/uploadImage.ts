import { supabase, SUPABASE_URL } from "./supabaseClient";

export const PRODUCT_IMAGES_BUCKET = "product-images";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1600;

interface UploadOptions {
  file: File;
  bucket: string;
  path: string;
  onStatus?: (status: string) => void;
}

async function uploadToStorage({ file, bucket, path, onStatus }: UploadOptions): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  onStatus?.("Comprimiendo imagen...");
  const compressed = await compressImage(file);

  onStatus?.("Subiendo a la nube...");

  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    console.error("Error en uploadToStorage:", error);
    throw new Error(
      (error.message || "No se pudo subir la imagen.") +
        " Verifica que el bucket '" +
        bucket +
        "' exista y permita subidas públicas."
    );
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function loadImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))),
      "image/jpeg",
      quality
    );
  });
}

export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (JPG, PNG, WebP, etc.).");
  }

  const original = file.size;
  if (original <= MAX_BYTES) {
    return file;
  }

  const image = await loadImage(file);

  let { naturalWidth: width, naturalHeight: height } = image;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo procesar la imagen.");
  }
  ctx.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(image.src);

  const qualities = [0.8, 0.65, 0.5, 0.35];
  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob.size <= MAX_BYTES) {
      return blob;
    }
  }

  const finalBlob = await canvasToBlob(canvas, 0.25);
  return finalBlob;
}

export async function uploadProductImage(options: { file: File; onStatus?: (status: string) => void }): Promise<string> {
  const { file, onStatus } = options;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "imagen";
  const extension = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
  const path = `product-${crypto.randomUUID()}.${extension}`;

  return uploadToStorage({ file, bucket: PRODUCT_IMAGES_BUCKET, path, onStatus });
}

export async function uploadStoreLogo(options: { file: File; onStatus?: (status: string) => void }): Promise<string> {
  const { file, onStatus } = options;

  const path = `logo-${crypto.randomUUID()}.jpg`;

  return uploadToStorage({ file, bucket: PRODUCT_IMAGES_BUCKET, path, onStatus });
}

export async function uploadStoreFavicon(options: { file: File; onStatus?: (status: string) => void }): Promise<string> {
  const { file, onStatus } = options;

  const path = `favicon-${crypto.randomUUID()}.jpg`;

  return uploadToStorage({ file, bucket: PRODUCT_IMAGES_BUCKET, path, onStatus });
}
