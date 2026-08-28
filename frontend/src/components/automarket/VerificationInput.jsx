import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VerificationInput({ value, type, onVerified, disabled }) {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | verifying | verified
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // If the phone/email being verified is edited, drop back to the unverified
  // state so a stale "Verified" can't carry over to a different target.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setStatus('idle');
    setCode('');
    setError('');
    setCountdown(0);
  }, [value]);

  const handleSend = async () => {
    if (!value || disabled) return;
    setStatus('sending');
    setError('');
    try {
      const res = await base44.functions.invoke('sendVerificationCode', { target: value, type });
      if (res.data?.error) throw new Error(res.data.error);
      setStatus('sent');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send code');
      setStatus('idle');
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) return;
    setStatus('verifying');
    setError('');
    try {
      const res = await base44.functions.invoke('verifyCode', { target: value, code, type });
      if (res.data?.verified) {
        setStatus('verified');
        onVerified?.(true);
      } else {
        setError(res.data?.error || 'Invalid code');
        setStatus('sent');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
      setStatus('sent');
    }
  };

  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-green-600 text-sm font-medium">
        <ShieldCheck className="w-4 h-4" /> Verified
      </span>
    );
  }

  const showCodeInput = status === 'sent' || status === 'verifying';

  return (
    <div className="space-y-2">
      {showCodeInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="flex-1 h-9"
            disabled={disabled || status === 'verifying'}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleVerify}
            disabled={disabled || status === 'verifying' || code.length !== 6}
            className="h-9"
          >
            {status === 'verifying' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={disabled || status === 'sending' || !value || countdown > 0}
          className="h-9 text-xs"
        >
          {status === 'sending' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          ) : null}
          {countdown > 0
            ? `Resend in ${countdown}s`
            : showCodeInput
              ? 'Resend code'
              : `Send verification code`}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}