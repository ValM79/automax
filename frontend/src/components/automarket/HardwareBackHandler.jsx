import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Ensures the Android hardware back button (the ◁ system back arrow) AND
 * any in-app "back" control (which calls navigate(-1) → history.back())
 * work inside the app WebView on real devices (e.g. Galaxy A71).
 *
 * Root cause: some Android WebViews change the browser URL on system back
 * but do NOT fire a `popstate` event, so React Router never notices the
 * URL changed and the view stays on the old page.
 *
 * Fix: poll the browser URL. When it diverges from the path React Router
 * last rendered, dispatch a real `PopStateEvent` so the router syncs to
 * the browser's URL.
 *
 * - `routerNavigating` guards the brief window between React Router's own
 *   pushState/replaceState and its re-render (prevents a spurious dispatch
 *   that previously made the in-app back button need two presses).
 * - `popstateFired` guards against double-dispatching when the WebView
 *   DOES fire a real popstate.
 * - If the divergence persists beyond `FORCE_SYNC_MS` we dispatch anyway,
 *   so a stuck guard flag can never permanently break back navigation.
 */
const FORCE_SYNC_MS = 300;

export default function HardwareBackHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const routerPathRef = useRef(location.pathname);

  // Update synchronously during render so the ref is always current.
  routerPathRef.current = location.pathname;

  useEffect(() => {
    let routerNavigating = false;
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      routerNavigating = true;
      const result = originalPushState.apply(this, args);
      setTimeout(() => { routerNavigating = false; }, 150);
      return result;
    };
    window.history.replaceState = function (...args) {
      routerNavigating = true;
      const result = originalReplaceState.apply(this, args);
      setTimeout(() => { routerNavigating = false; }, 150);
      return result;
    };

    let popstateFired = false;
    const onPopstate = () => {
      popstateFired = true;
      setTimeout(() => { popstateFired = false; }, 150);
    };
    window.addEventListener('popstate', onPopstate);

    let divergenceSince = 0;
    let dispatchedForDivergence = false;

    const checkBrowserUrl = () => {
      const diverged = window.location.pathname !== routerPathRef.current;

      if (!diverged) {
        divergenceSince = 0;
        dispatchedForDivergence = false;
        return;
      }

      if (divergenceSince === 0) divergenceSince = Date.now();
      const persisted = Date.now() - divergenceSince;

      const guardedReady = !routerNavigating && !popstateFired;
      const forced = persisted > FORCE_SYNC_MS;

      if ((guardedReady || forced) && !dispatchedForDivergence) {
        dispatchedForDivergence = true;
        // Real PopStateEvent (carrying history.state) is honored reliably
        // across WebViews where a generic Event was not.
        window.dispatchEvent(
          new PopStateEvent('popstate', { state: window.history.state })
        );

        // Safety net: if the router still hasn't synced shortly after the
        // popstate dispatch, drive it directly so the user is never stuck.
        setTimeout(() => {
          if (window.location.pathname !== routerPathRef.current) {
            navigate(window.location.pathname + window.location.search, { replace: true });
          }
        }, 80);
      }
    };

    const interval = setInterval(checkBrowserUrl, 80);
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', onPopstate);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [navigate]);

  return null;
}