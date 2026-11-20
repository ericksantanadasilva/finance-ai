import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/**
 * true quando o sistema pede movimento reduzido. Serve para animações feitas
 * em JavaScript (ex.: Recharts), que o CSS de prefers-reduced-motion não
 * alcança. Acompanha a mudança da preferência sem recarregar a página.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // No servidor não há preferência: assume que pode animar
    () => false,
  );
}
