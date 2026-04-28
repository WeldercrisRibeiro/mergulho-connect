import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  // Normalize path (backslashes to slashes, remove leading ./ or ../ or uploads/)
  let filename = path.replace(/\\/g, '/');
  if (filename.includes('/')) {
    filename = filename.split('/').pop()!;
  }
  return `/api/uploads/${filename}`;
}
