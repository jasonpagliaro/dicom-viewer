import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTimestamp(date: Date | string | null | undefined) {
  if (!date) {
    return "Unavailable";
  }

  return format(new Date(date), "MMM d, yyyy HH:mm");
}

export function formatRelative(date: Date | string | null | undefined) {
  if (!date) {
    return "never";
  }

  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatFileSize(bytes: bigint | number | string | null | undefined) {
  if (bytes === null || bytes === undefined) {
    return "0 B";
  }

  const value =
    typeof bytes === "bigint"
      ? Number(bytes)
      : typeof bytes === "string"
        ? Number.parseInt(bytes, 10)
        : bytes;

  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function splitTags(input: string) {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function safeStudyTitle(
  studyDescription: string | null | undefined,
  patientName: string | null | undefined,
) {
  return studyDescription || patientName || "Untitled study";
}
