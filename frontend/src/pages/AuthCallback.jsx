// Needed only for "Continue with Google/Apple" login — email/password login
// does not use this page. Cognito's Hosted UI redirects here with an
// authorization code after a successful federated sign-in.
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Missing authorization code');
      return;
    }
    api.auth
      .completeOAuthLogin(code)
      .then((redirectTo) => {
        window.location.replace(redirectTo);
      })
      .catch((err) => setError(err.message || 'Login failed'));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={() => navigate('/login')} className="underline">
            Back to sign in
          </button>
        </div>
      ) : (
        <p className="text-muted-foreground">Signing you in…</p>
      )}
    </div>
  );
}
