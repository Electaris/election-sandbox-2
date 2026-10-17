import type { CSSProperties, ReactNode } from "react";
import type { DockSnap } from "./useWorkspaceDock";

export function AppShell({ children, workspaceMode, experienceMode, geographyLevel, snap, dragHeight, inspectorOpen }: {
  children: ReactNode;
  workspaceMode: "home" | "laboratory";
  experienceMode: "swingometer" | "election-night";
  geographyLevel: string;
  snap: DockSnap;
  dragHeight: number | null;
  inspectorOpen: boolean;
}) {
  return <main className="application-shell premium-shell" data-workspace-mode={workspaceMode}
    data-experience-mode={experienceMode} data-geography-level={geographyLevel}
    data-dock-snap={snap} data-inspector-open={inspectorOpen} data-dock-resizing={dragHeight != null}
    style={dragHeight == null ? undefined : { "--workspace-dock-size": `${dragHeight}px` } as CSSProperties}>
    {children}
  </main>;
}

export function WorkspaceHeader({ children, inspectorOpen, onToggleInspector }: {
  children: ReactNode; inspectorOpen: boolean; onToggleInspector: () => void;
}) {
  return <section className="workspace-header" aria-label="Workspace context">
    {children}
    <button className="inspector-toggle" aria-expanded={inspectorOpen} aria-controls="analysis-inspector"
      onClick={onToggleInspector} type="button">{inspectorOpen ? "Hide analysis" : "Show analysis"}</button>
  </section>;
}

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="workbench workspace-layout" id="top">{children}</div>;
}

export function AnalysisInspector({ children, open, className }: {
  children: ReactNode; open: boolean; className: string;
}) {
  return <aside id="analysis-inspector" className={`${className} analysis-inspector`} aria-label="Scenario editor" hidden={!open}>
    {children}
  </aside>;
}
