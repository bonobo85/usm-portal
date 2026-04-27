'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(27,62,124,0.12),transparent_60%),radial-gradient(ellipse_at_70%_30%,rgba(196,151,59,0.08),transparent_50%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-or-dim to-transparent" />

      {/* Card */}
      <div className="relative bg-fond-1 border border-border rounded-2xl p-14 text-center w-[440px] max-w-[92vw] shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
        <img src="/logo.png" alt="U.S. Marshal" className="w-24 h-24 mx-auto mb-7 rounded-2xl shadow-[0_12px_40px_rgba(196,151,59,0.35)] object-contain" />
        <h1 className="font-display text-4xl tracking-[0.12em] text-or">U.S. MARSHAL</h1>
        <p className="text-texte-3 text-sm mt-1 mb-9">Bureau du Comté de Blaine — Portail Interne</p>
        <button
          onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
          className="w-full py-4 px-7 bg-[#5865F2] text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all font-body flex items-center justify-center gap-3 hover:bg-[#4752C4] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(88,101,242,0.3)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Se connecter avec Discord
        </button>
      </div>
    </div>
  );
}
