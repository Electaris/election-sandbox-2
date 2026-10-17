import { useRef, type ReactNode, type PointerEvent } from "react";
import type { DockSnap } from "./useWorkspaceDock";

export function WorkspaceDock({ children, label, resizeLabel, night = false, snap, onSnap, onResize }: {
  children: ReactNode; label: string; resizeLabel: string; night?: boolean; snap: DockSnap;
  onSnap: (snap: DockSnap) => void; onResize: (height: number | null) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; height: number } | null>(null);
  function bounds() {
    const shell = panelRef.current?.closest(".application-shell");
    const header = shell?.querySelector(".workspace-header")?.getBoundingClientRect().height ?? 90;
    const compact = window.matchMedia("(max-width: 800px)").matches;
    const min = night ? compact ? 192 : window.innerWidth <= 1200 ? 120 : 96 : 64;
    const max = Math.max(min, Math.min(window.innerHeight * .76, window.innerHeight - Math.max(172, header + 72)));
    return { min, max };
  }
  function end(event: PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const height = panelRef.current?.getBoundingClientRect().height ?? bounds().min;
    const { min, max } = bounds();
    onSnap(height < min + 36 ? "collapsed" : height > window.innerHeight * .6 || height > max - 36 ? "expanded" : "working");
  }
  return <div ref={panelRef} className={`laboratory-drawer workspace-dock${night ? " night-command-dock" : ""}`}
    aria-label={label} role="region" data-snap={snap} onKeyDownCapture={(event) => {
      if (!night || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const target = event.target as HTMLElement;
      if (target.getAttribute("role") !== "tab") return;
      const tabs = [...(target.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])];
      const index = tabs.indexOf(target as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[next]?.click();
      tabs[next]?.focus();
    }}>
    <button aria-label={resizeLabel} className="drawer-grab-handle" type="button"
      onPointerDown={(event) => {
        dragRef.current = { y: event.clientY, height: panelRef.current?.getBoundingClientRect().height ?? bounds().min };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }} onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        const { min, max } = bounds();
        onResize(Math.max(min, Math.min(max, drag.height + drag.y - event.clientY)));
      }} onPointerUp={end} onPointerCancel={end}
      onKeyDown={(event) => {
        const snaps: DockSnap[] = ["collapsed", "working", "expanded"];
        const direction = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
        if (direction) {
          event.preventDefault();
          onSnap(snaps[Math.max(0, Math.min(2, snaps.indexOf(snap) + direction))]);
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          onSnap(event.key === "Home" ? "collapsed" : "expanded");
        }
      }}><span /></button>
    {children}
  </div>;
}
