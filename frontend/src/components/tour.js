import { useEffect, useState } from "react";

const KEY = "th.tour.v1";
const EVENT = "th:tour";

export const TOUR_STEPS = [
  {
    id: "command",
    label: "See what needs you today",
    detail: "Command Center ranks roles by risk, not recency.",
    href: "/app",
    test: (p) => p === "/app",
  },
  {
    id: "pipeline",
    label: "Open the at-risk pipeline",
    detail: "Stripe's backend search is waiting on the client.",
    href: "/app/pipeline/1",
    test: (p) => /^\/app\/pipeline\/\d+$/.test(p),
  },
  {
    id: "matching",
    label: "Rank candidates against the brief",
    detail: "Deterministic fit scores with must-have gaps called out.",
    href: "/app/pipeline/1/matching",
    test: (p) => p.endsWith("/matching"),
  },
  {
    id: "candidate",
    label: "Read one candidate's evidence",
    detail: "Why Aarav is a 91% fit — and what to probe.",
    href: "/app/candidates/1",
    test: (p) => p.startsWith("/app/candidates/"),
  },
  {
    id: "health",
    label: "Diagnose role health",
    detail: "Volume, quality, velocity and client responsiveness.",
    href: "/app/pipeline/1/health",
    test: (p) => p.endsWith("/health") || p.endsWith("/market"),
  },
  {
    id: "report",
    label: "Send the weekly client report",
    detail: "A ready-to-share narrative, generated from pipeline state.",
    href: "/app/pipeline/1/report",
    test: (p) => p.endsWith("/report"),
  },
  {
    id: "client",
    label: "See exactly what the client sees",
    detail: "No recruiter notes, no internal rejection reasons.",
    href: "/client",
    test: (p) => p.startsWith("/client"),
  },
];

function read() {
  try {
    return { visited: [], dismissed: false, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { visited: [], dismissed: false };
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT));
}

export function recordVisit(pathname) {
  const step = TOUR_STEPS.find((s) => s.test(pathname));
  if (!step) return;
  const state = read();
  if (state.visited.includes(step.id)) return;
  write({ ...state, visited: [...state.visited, step.id] });
}

export function setTourDismissed(dismissed) {
  write({ ...read(), dismissed });
}

export function resetTour() {
  write({ visited: [], dismissed: false });
}

export function useTour() {
  const [state, setState] = useState(read);
  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const done = TOUR_STEPS.filter((s) => state.visited.includes(s.id)).length;
  return { ...state, done, total: TOUR_STEPS.length, complete: done === TOUR_STEPS.length };
}
