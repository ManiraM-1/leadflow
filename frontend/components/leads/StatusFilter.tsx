import { STATUS_LABELS } from "@/lib/status";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

interface StatusFilterProps {
  value: LeadStatus | null;
  onChange: (status: LeadStatus | null) => void;
}

const OPTIONS: { value: LeadStatus | null; label: string }[] = [
  { value: null, label: "All" },
  ...LEAD_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div role="group" aria-label="Filter by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              active
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
