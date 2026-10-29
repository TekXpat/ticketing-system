"use client";

const KEY = "theme";

// Flips between light and dark and remembers the choice in this browser.
// The first visit is decided by the inline script in the root layout.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage can be blocked. The theme still changes for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-outline btn-small"
      aria-label="Switch between dark and light mode"
    >
      <span className="theme-to-dark">Dark mode</span>
      <span className="theme-to-light">Light mode</span>
    </button>
  );
}
