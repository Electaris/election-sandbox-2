import { useCallback, useEffect, useState } from "react";

export type DockSnap = "collapsed" | "working" | "expanded";
type Mode = "swingometer" | "election-night";
type DockState = { snap: DockSnap; dragHeight: number | null; inspectorOpen: boolean; compactInspectorOpen: boolean };

export function useWorkspaceDock(mode: Mode, initialSwingSnap: DockSnap = "collapsed") {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 1023px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setCompact(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [states, setStates] = useState<Record<Mode, DockState>>({
    swingometer: { snap: initialSwingSnap, dragHeight: null, inspectorOpen: true, compactInspectorOpen: false },
    "election-night": { snap: "collapsed", dragHeight: null, inspectorOpen: true, compactInspectorOpen: false },
  });
  const current = states[mode];
  const update = useCallback((changes: Partial<DockState>) => setStates((all) => ({ ...all, [mode]: { ...all[mode], ...changes } })), [mode]);
  const changeSnap = useCallback((snap: DockSnap) => update({ snap, dragHeight: null }), [update]);
  return {
    ...current,
    inspectorOpen: compact ? current.compactInspectorOpen : current.inspectorOpen,
    changeSnap,
    setDragHeight: (dragHeight: number | null) => update({ dragHeight }),
    toggleInspector: () => update(compact
      ? { compactInspectorOpen: !current.compactInspectorOpen }
      : { inspectorOpen: !current.inspectorOpen }),
  };
}
