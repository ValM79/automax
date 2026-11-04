import { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';

// The businesses listed in one service category (see lib/serviceCategories.js). Returns null while loading, then an array.
// A provider looks like { id, name, county, area, services: [...], open_24_7, opening_times, avatar_url }.
// The backend function that fills this is not live yet, so a failed request is shown as "no businesses yet".
export function useServiceProviders(category) {
  const [providers, setProviders] = useState(null);
  useEffect(() => {
    let alive = true;
    setProviders(null);
    api.functions.invoke('listServiceProviders', { category })
      .then((res) => { if (alive) setProviders(res?.data?.providers || []); })
      .catch(() => { if (alive) setProviders([]); });
    return () => { alive = false; };
  }, [category]);
  return providers;
}
