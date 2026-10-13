"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { addDiscussion, ApiError, errorMessage } from "@/lib/api";
import { toDateTimeLocalValue } from "@/lib/time";
import type { DiscussionCreated } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface DiscussionFormProps {
  leadId: number;
  now: number;
  onSaved: (result: DiscussionCreated) => void;
}

interface FormErrors {
  note?: string;
  followUpAt?: string;
  form?: string;
}

/** Quick picks for the follow-up field; each returns a Date relative to the click. */
const QUICK_PICKS: { label: string; at: () => Date }[] = [
  { label: "In 2 hours", at: () => new Date(Date.now() + 2 * 60 * 60 * 1000) },
  { label: "Tomorrow 10 am", at: () => atHour(1, 10) },
  { label: "In 3 days", at: () => atHour(3, 10) },
];

function atHour(daysFromToday: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export function DiscussionForm({ leadId, now, onSaved }: DiscussionFormProps) {
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const nextErrors: FormErrors = {};
    if (!note.trim()) nextErrors.note = "Write what you discussed.";
    // datetime-local values have no zone; new Date() reads them as the user's local time.
    const followUpDate = followUp ? new Date(followUp) : null;
    if (followUpDate && followUpDate.getTime() <= Date.now()) nextErrors.followUpAt = "Pick a time in the future.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const result = await addDiscussion(leadId, {
        note: note.trim(),
        followUpAt: followUpDate?.toISOString(),
      });
      setNote("");
      setFollowUp("");
      onSaved(result);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({ form: errorMessage(error) });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void save();
  }

  // Ctrl/Cmd + Enter saves from inside the note field.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void save();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div>
        <label htmlFor="discussion-note" className="text-sm font-medium text-slate-700">
          New discussion
        </label>
        <textarea
          id="discussion-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          maxLength={2000}
          placeholder="What did you talk about?"
          aria-invalid={Boolean(errors.note)}
          aria-describedby={errors.note ? "discussion-note-error" : undefined}
          className="mt-1 block w-full resize-y rounded-lg border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:outline-none aria-invalid:ring-red-500"
        />
        {errors.note && (
          <p id="discussion-note-error" className="mt-1 text-xs text-red-600">
            {errors.note}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="discussion-follow-up" className="text-sm font-medium text-slate-700">
          Follow-up <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            id="discussion-follow-up"
            type="datetime-local"
            value={followUp}
            min={toDateTimeLocalValue(new Date(now))}
            onChange={(event) => setFollowUp(event.target.value)}
            aria-invalid={Boolean(errors.followUpAt)}
            aria-describedby={errors.followUpAt ? "discussion-follow-up-error" : undefined}
            className="h-9 rounded-lg border-0 px-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none aria-invalid:ring-red-500"
          />
          {QUICK_PICKS.map((pick) => (
            <Button key={pick.label} variant="ghost" size="sm" onClick={() => setFollowUp(toDateTimeLocalValue(pick.at()))}>
              {pick.label}
            </Button>
          ))}
          {followUp && (
            <Button variant="ghost" size="sm" onClick={() => setFollowUp("")}>
              Clear
            </Button>
          )}
        </div>
        {errors.followUpAt && (
          <p id="discussion-follow-up-error" className="mt-1 text-xs text-red-600">
            {errors.followUpAt}
          </p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className="text-sm text-red-600">
          {errors.form}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <span className="hidden text-xs text-slate-400 sm:inline">Ctrl + Enter to save</span>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save discussion"}
        </Button>
      </div>
    </form>
  );
}
