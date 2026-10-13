import { formatDateTime, formatFollowUp } from "@/lib/time";

interface FollowUpTagProps {
  followUpAt: string;
  overdue: boolean;
  dueToday: boolean;
  now: number;
}

/** Follow-up chip: red when overdue, amber when due today, grey otherwise. */
export function FollowUpTag({ followUpAt, overdue, dueToday, now }: FollowUpTagProps) {
  const tone = overdue
    ? "bg-red-50 text-red-700 ring-red-600/25"
    : dueToday
      ? "bg-amber-50 text-amber-800 ring-amber-600/25"
      : "bg-slate-100 text-slate-600 ring-slate-500/15";

  return (
    <span
      title={formatDateTime(followUpAt)}
      className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      <ClockIcon />
      {overdue ? "Overdue · " : ""}
      {formatFollowUp(followUpAt, now)}
    </span>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75V8l2.25 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
