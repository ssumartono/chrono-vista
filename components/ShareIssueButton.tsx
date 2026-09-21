'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

export function ShareIssueButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, url: window.location.href }); return; } catch { return; }
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }
  return <button type="button" onClick={share} aria-label={copied ? 'Tautan disalin' : 'Bagikan issue'}><Share2 size={19}/>{copied ? 'Tautan disalin' : 'Bagikan'}</button>;
}
