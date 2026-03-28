import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPeriod(date: Date): "오전" | "오후" {
  return date.getHours() < 12 ? "오전" : "오후";
}

export function toDate(val: Timestamp | Date | undefined | null): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  return val.toDate();
}

export function formatDateTime(val: Timestamp | Date | undefined | null): string {
  const date = toDate(val);
  if (!date) return "-";
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${m}월 ${d}일 ${h}:${min}`;
}

export function formatDateShort(val: Timestamp | Date | undefined | null): string {
  const date = toDate(val);
  if (!date) return "-";
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}월 ${d}일`;
}

export function verifyPassword(input: string, mode: "inspector" | "admin"): boolean {
  const passwords: Record<string, string> = {
    inspector: "6400",
    admin: "6167",
  };
  return input === passwords[mode];
}
