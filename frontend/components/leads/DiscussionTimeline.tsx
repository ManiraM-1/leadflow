import { formatDateTime, formatFollowUp, timeAgo } from "@/lib/time";
import type { Discussion } from "@/lib/types";

interface DiscussionTimelineProps {
  /** Newest first, as returned by the API. */
  discussions: Discussion[];
  now: number;
}

export function DiscussionTimeline({ discussions, now }: DiscussionTimelineProps) {
  if (discussions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
        No discussions yet. Log the first one below.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {discussions.map((discussion, index) => (
        <li key={discussion.id} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-white ${index === 0 ? "bg-slate-900" : "bg-slate-300"}`}
          />
          <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{discussion.note}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <time dateTime={discussion.createdAt} title={formatDateTime(discussion.createdAt)}>
              {timeAgo(discussion.createdAt, now)} · {formatDateTime(discussion.createdAt)}
            </time>
            {discussion.followUpAt && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                Follow-up set for {formatFollowUp(discussion.followUpAt, now)}
              </span>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
