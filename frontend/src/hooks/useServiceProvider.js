import { useEffect, useState } from 'react';
import { api } from '@/api/apiClient';

// One listed Service Business, for its own page. Returns { provider, state } where state is 'loading', 'ready' or 'missing'
// (not found, no longer listed, or the request failed). See backend/lambda/listServiceProviders.
export function useServiceProvider(id) {
  const [result, setResult] = useState({ provider: null, state: 'loading' });
  useEffect(() => {
    let alive = true;
    setResult({ provider: null, state: 'loading' });
    api.functions.invoke('listServiceProviders', { id })
      .then((res) => { if (alive) setResult(res?.data?.provider ? { provider: res.data.provider, state: 'ready' } : { provider: null, state: 'missing' }); })
      .catch(() => { if (alive) setResult({ provider: null, state: 'missing' }); });
    return () => { alive = false; };
  }, [id]);
  return result;
}
