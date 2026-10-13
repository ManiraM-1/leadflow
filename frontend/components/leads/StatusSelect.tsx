import { STATUS_LABELS } from "@/lib/status";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

interface StatusSelectProps {
  id: string;
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
}

export function StatusSelect({ id, value, onChange, disabled }: StatusSelectProps) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as LeadStatus)}
      className="h-9 rounded-lg border-0 bg-white pl-3 pr-8 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none disabled:opacity-60"
    >
      {LEAD_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
