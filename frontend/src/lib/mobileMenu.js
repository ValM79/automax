import { useSyncExternalStore } from 'react';

// Shared open/closed state for the slide-in mobile menu, so the bottom tab bar's
// Profile tab can open the same menu the hamburger button opens. Each page renders
// its own Navbar (which owns the menu), so the Navbar registers itself as the "host";
// if no Navbar is on screen the tab falls back to navigating to /profile.
let open = false;
let hosts = 0;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export function setMobileMenuOpen(value) {
  if (open !== value) {
    open = value;
    emit();
  }
}

export const toggleMobileMenu = () => setMobileMenuOpen(!open);

export const hasMenuHost = () => hosts > 0;

export function registerMenuHost() {
  hosts += 1;
  return () => {
    hosts -= 1;
    // Leaving a page must not leave the menu open on the next one.
    setMobileMenuOpen(false);
  };
}

export function useMobileMenuOpen() {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => open
  );
}
