import { useRef, useState, type ReactNode } from "react";

export function GlobalHeader({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  return <header className="masthead" data-navigation-open={menuOpen}
    onKeyDownCapture={(event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    }} onClickCapture={(event) => {
      if ((event.target as HTMLElement).closest(".primary-nav")) setMenuOpen(false);
    }}>
    {children}
    <button className="navigation-toggle" ref={toggleRef} type="button" aria-expanded={menuOpen}
      aria-controls="product-navigation" onClick={() => setMenuOpen((open) => !open)}>
      {menuOpen ? "Close menu" : "Menu"}
    </button>
  </header>;
}
