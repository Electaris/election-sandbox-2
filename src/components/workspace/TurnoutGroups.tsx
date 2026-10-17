import { useState, type ReactNode } from "react";

export function TurnoutGroups({ available, initialOpen, active, children }: {
  available: boolean;
  initialOpen: boolean;
  active: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);
  if (!available) return <>{children}</>;
  return <details className="turnout-groups-disclosure" open={open}
    onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>
      <span>Group turnout assumptions</span>
      <small>{active ? "Active group additions" : "Optional · No group additions"}</small>
    </summary>
    {children}
  </details>;
}
