"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type TraceRow = { text: string; meta?: string; state: "pending" | "active" | "done" | "error" };

const EASE = "cubic-bezier(0.23,1,0.32,1)";

function Mark({ state }: { state: TraceRow["state"] }) {
  if (state === "active")
    return <span className="size-3 shrink-0 rounded-full border-[1.5px] border-line-strong border-t-ink-2 motion-safe:animate-[spin_700ms_linear_infinite]" />;
  if (state === "pending") return <span className="size-3 shrink-0 rounded-full border-[1.5px] border-line" />;
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${state === "error" ? "stroke-red-500" : "stroke-ink-3"}`}>
      <path d={state === "error" ? "M6 6l12 12M18 6L6 18" : "M20 6L9 17l-5-5"} />
    </svg>
  );
}

export default function Thinking({
  active,
  done,
  rows,
  working,
  prose,
  open,
  icon,
}: {
  active: string;
  done: string;
  rows: TraceRow[];
  working: boolean;
  prose?: boolean;
  open?: boolean;
  icon?: ReactNode;
}) {
  const [manual, setManual] = useState<boolean | null>(null);
  const expanded = manual ?? (open ?? working);
  const traceRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);
  const visible = rows.filter((r) => r.state !== "pending" || !prose);

  useLayoutEffect(() => {
    if (traceRef.current) setLineHeight(traceRef.current.offsetHeight);
  }, [visible.length, expanded]);

  return (
    <div className="flex w-full flex-col">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setManual(!expanded)}
        className="-mx-1.5 flex w-fit items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-100 hover:bg-hover"
      >
        <span className={`flex shrink-0 transition-colors duration-200 ${working ? "text-ink-2" : "text-ink-3"}`}>
          {icon ?? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          )}
        </span>
        <span role="status" className="contents">
          {working ? (
            <span className="shimmer-text text-[13px] font-medium whitespace-nowrap">{active}</span>
          ) : (
            <span key="done" className="text-[13px] font-medium whitespace-nowrap text-ink-2 motion-safe:animate-[fade-in_350ms_ease-out_both]">{done}</span>
          )}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3 transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-400"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr", opacity: expanded ? 1 : 0, transitionTimingFunction: EASE }}
      >
        <div className="overflow-hidden">
          <div className="relative mt-1 ml-[5px] pl-4">
            <span aria-hidden className="absolute left-[3px] w-px bg-line" style={{ top: -8, height: lineHeight ? lineHeight - 2 : 0, transition: `height 500ms ${EASE}` }} />
            <div ref={traceRef} className="flex flex-col gap-1 py-1">
              {visible.map((row, i) => (
                <div
                  key={row.text}
                  className="flex min-h-7 w-full items-center gap-2 rounded-md px-1.5 py-0.5 motion-safe:animate-[fade-up_320ms_var(--ease-out)_both]"
                  style={{ animationDelay: `${prose ? 0 : i * 60}ms` }}
                >
                  {!prose && <Mark state={row.state} />}
                  <span className={`min-w-0 text-[13px] ${prose ? "leading-relaxed text-ink-2" : `truncate font-medium ${row.state === "pending" ? "text-ink-3" : row.state === "error" ? "text-red-700" : "text-ink"}`}`}>
                    {row.text}
                  </span>
                  {row.meta && <span className="shrink-0 font-mono text-[11.5px] text-ink-3 tabular-nums">{row.meta}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReplayThinking({ active, done, text, icon }: { active: string; done: string; text: string; icon?: ReactNode }) {
  const sentences = useMemo(() => text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text], [text]);
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const tick = (n: number) => {
        setShown(n);
        if (n < sentences.length) t = setTimeout(() => tick(n + 1), 700 + Math.min(sentences[n].length * 12, 900));
      };
      t = setTimeout(() => (instant ? setShown(sentences.length) : tick(1)), instant ? 0 : 600);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [sentences]);

  const working = shown < sentences.length;
  return (
    <div ref={ref}>
      <Thinking
        active={active}
        done={done}
        working={working}
        open
        prose
        icon={icon}
        rows={sentences.map((s, i) => ({ text: s, state: i < shown ? "done" : "pending" }))}
      />
    </div>
  );
}
