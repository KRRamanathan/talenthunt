import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { resetTour } from "./tour.js";

const PAGES = [
  { id: "p-command", group: "Go to", label: "Command Center", hint: "Today's priorities", href: "/app" },
  { id: "p-pipeline", group: "Go to", label: "Pipeline", hint: "All open roles", href: "/app/pipeline" },
  { id: "p-notif", group: "Go to", label: "Notifications", hint: "Slack · Email · Calendar", href: "/app/notifications" },
  { id: "p-integrations", group: "Go to", label: "Integrations", hint: "Connect tools & ATS", href: "/app/integrations" },
  { id: "p-jira", group: "Go to", label: "Jira delivery board", hint: "Sprints · epics · synced risks", href: "/app/delivery" },
  { id: "p-client", group: "Go to", label: "Client portal", hint: "What clients see", href: "/client" },
  { id: "a-intake", group: "Actions", label: "Open a new role", hint: "Role intake", href: "/intake" },
];

const ROLE_VIEWS = [
  ["", "Pipeline"],
  ["/matching", "Match candidates"],
  ["/calibration", "Calibrate brief"],
  ["/health", "Role health"],
  ["/market", "Market intel"],
  ["/report", "Weekly report"],
];

export function isPaletteShortcut(e) {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [roles, setRoles] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    if (!roles) {
      api
        .roles(0, 50)
        .then((res) => setRoles(res.items))
        .catch(() => setRoles([]));
    }
  }, [open, roles]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const roleItems = (roles || []).flatMap((role) =>
      ROLE_VIEWS.map(([suffix, view], i) => ({
        id: `r-${role.id}${suffix}`,
        group: i === 0 ? "Roles" : "Role views",
        label: i === 0 ? `${role.client_name} — ${role.title}` : `${view} · ${role.client_name} ${role.title}`,
        hint: i === 0 ? `${role.candidate_count} in pipeline · Health ${role.health_score}` : view,
        status: i === 0 ? role.health_status : null,
        href: `/app/pipeline/${role.id}${suffix}`,
      }))
    );
    const utility = [
      {
        id: "u-tour",
        group: "Actions",
        label: "Restart the guided tour",
        hint: "Seven steps, about five minutes",
        run: () => {
          resetTour();
          navigate("/app");
        },
      },
      {
        id: "u-reset",
        group: "Actions",
        label: "Reset demo data",
        hint: "Restore the original story",
        run: async () => {
          try {
            toast.push("Restoring demo data…");
            await api.resetDemo();
            window.location.assign("/app");
          } catch (err) {
            toast.push(err.message, "error");
          }
        },
      },
    ];

    if (!q) {
      return [...PAGES, ...roleItems.filter((r) => r.group === "Roles").slice(0, 5), ...utility];
    }
    const terms = q.split(/\s+/);
    return [...PAGES, ...roleItems, ...utility]
      .filter((item) => {
        const hay = `${item.label} ${item.hint} ${item.group}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 10);
  }, [query, roles, navigate, toast]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const choose = (item) => {
    onClose();
    if (item.run) item.run();
    else navigate(item.href);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/35 px-4 pt-[12vh] backdrop-blur-[3px]"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="surface-card animate-rise w-full max-w-xl overflow-hidden shadow-lift"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-muted">
            <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search roles, clients, or jump to a view…"
            className="w-full bg-transparent text-[1rem] placeholder:text-muted/60 focus:outline-none"
          />
          <kbd className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted">Esc</kbd>
        </div>

        <ul ref={listRef} className="scroll-soft max-h-[52vh] overflow-y-auto py-2">
          {roles === null && query && (
            <li className="px-5 py-3 text-[13px] text-muted">Loading roles…</li>
          )}
          {items.length === 0 && roles !== null && (
            <li className="px-5 py-8 text-center text-[13px] text-muted">
              Nothing matches “{query}”. Try a client name like Stripe or a view like “report”.
            </li>
          )}
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id}>
                {header && <p className="type-caption px-5 pb-1.5 pt-3 text-[10px]">{header}</p>}
                <button
                  type="button"
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                  className={`mx-2 flex w-[calc(100%-1rem)] items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition duration-100 ${
                    index === active ? "bg-ink text-paper" : "text-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {item.status && (
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          item.status === "blocked" ? "bg-risk" : item.status === "at_risk" ? "bg-accent" : "bg-track"
                        }`}
                      />
                    )}
                    <span className="truncate text-[0.9375rem] font-medium">{item.label}</span>
                  </span>
                  <span className={`shrink-0 text-[12px] ${index === active ? "text-paper/70" : "text-muted"}`}>
                    {item.hint}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-border bg-surface/60 px-5 py-2.5 text-[11.5px] text-muted">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span className="ml-auto">Ctrl / ⌘ K anywhere</span>
        </div>
      </div>
    </div>
  );
}
