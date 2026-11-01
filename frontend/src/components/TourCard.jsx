import { Link } from "react-router-dom";
import { TOUR_STEPS, resetTour, setTourDismissed, useTour } from "./tour.js";

export default function TourCard() {
  const tour = useTour();

  if (tour.dismissed) {
    return (
      <button
        type="button"
        onClick={() => setTourDismissed(false)}
        className="mt-8 text-[13px] font-semibold text-muted transition hover:text-ink"
      >
        Show the guided tour ({tour.done}/{tour.total})
      </button>
    );
  }

  if (tour.complete) {
    return (
      <div className="animate-rise mt-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-track/25 bg-track-soft/50 px-5 py-4">
        <p className="text-[0.9375rem]">
          <span className="font-semibold">Tour complete.</span>{" "}
          <span className="text-muted">You've seen the whole loop, from brief to client report.</span>
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost text-[13px]" onClick={resetTour}>
            Replay
          </button>
          <button type="button" className="btn-ghost text-[13px]" onClick={() => setTourDismissed(true)}>
            Hide
          </button>
        </div>
      </div>
    );
  }

  const nextIdx = TOUR_STEPS.findIndex((s) => !tour.visited.includes(s.id));
  const pct = Math.round((tour.done / tour.total) * 100);

  return (
    <section className="surface-card animate-rise mt-8 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4 sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-9 w-9 shrink-0">
            <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#E4D8C8" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#B44A28"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-semibold tabular-nums">
              {tour.done}/{tour.total}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-snug">Your first five minutes</p>
            <p className="mt-0.5 text-[13px] text-muted">
              Follow one real search from brief to client report. Steps tick off as you go.
            </p>
          </div>
        </div>
        <button type="button" className="btn-ghost -mr-2 shrink-0 text-[13px]" onClick={() => setTourDismissed(true)}>
          Hide
        </button>
      </div>

      <ol className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        {TOUR_STEPS.map((step, i) => {
          const done = tour.visited.includes(step.id);
          const next = i === nextIdx;
          return (
            <li key={step.id} className={i >= 4 ? "lg:border-t lg:border-border" : ""}>
              <Link
                to={step.href}
                className={`group flex h-full gap-3 px-6 py-4 transition duration-200 hover:bg-surface/70 ${
                  next ? "bg-accent-soft/35" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    done
                      ? "bg-track-soft text-track"
                      : next
                      ? "bg-accent text-paper"
                      : "border border-border text-muted"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[13.5px] font-semibold leading-snug ${
                      done ? "text-muted line-through decoration-border" : "group-hover:text-accent"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-muted">{step.detail}</span>
                  {next && <span className="mt-2 inline-block text-[12px] font-semibold text-accent">Start here →</span>}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="hidden lg:block lg:border-t lg:border-border" aria-hidden />
      </ol>
    </section>
  );
}
