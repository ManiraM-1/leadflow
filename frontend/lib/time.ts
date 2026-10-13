const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
const fullFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(iso: string, now: number): string {
  const elapsed = Math.max(0, now - new Date(iso).getTime());
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} h ago`;
  const days = Math.floor(elapsed / DAY);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  return dateFormat.format(new Date(iso));
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today, 4:30 pm", "Tomorrow, 11:00 am", "Yesterday, 4:00 pm" or "Mon, 19 Oct, 11:00 am". */
export function formatFollowUp(iso: string, now: number): string {
  const date = new Date(iso);
  const today = new Date(now);
  const tomorrow = new Date(now + DAY);
  const yesterday = new Date(now - DAY);

  const time = timeFormat.format(date);
  if (isSameDay(date, today)) return `Today, ${time}`;
  if (isSameDay(date, tomorrow)) return `Tomorrow, ${time}`;
  if (isSameDay(date, yesterday)) return `Yesterday, ${time}`;
  return `${dateFormat.format(date)}, ${time}`;
}

/** Full timestamp for tooltips and the timeline, e.g. "13 Oct 2026, 4:30 pm". */
export function formatDateTime(iso: string): string {
  return fullFormat.format(new Date(iso));
}

/** Value for <input type="datetime-local">, in local time: "2026-10-13T16:30". */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
