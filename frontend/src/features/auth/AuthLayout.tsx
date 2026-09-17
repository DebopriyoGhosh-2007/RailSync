import React from 'react';
import { OperationalDisclaimer } from '@/components/shell/OperationalDisclaimer';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-shell-bg)]">
      {/* Left Panel - Brand */}
      <div className="md:w-1/3 lg:w-2/5 text-white p-8 flex flex-col relative overflow-hidden shrink-0">
        {/* Background image */}
        <img
          src="/train.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="font-display font-bold text-2xl tracking-wide flex items-center gap-3 mb-12">
            <img src="/logo.png" alt="RailSync" className="w-9 h-9 object-contain drop-shadow-lg" />
            RailSync
          </div>
          
          <div className="mt-auto mb-8 hidden md:block">
            <h1 className="text-3xl font-display font-bold mb-4">Unifying<br/>Railway Operations.</h1>
            <p className="text-slate-200 text-lg leading-relaxed max-w-sm">
              Authoritative, secure access to the central maintenance and planning intake.
            </p>
          </div>
          <div className="mt-auto text-xs text-slate-400 font-mono">
            SECURE ACCESS PORTAL · V2.0
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Header replacement */}
        <div className="md:hidden bg-[var(--color-shell-nav)] p-4 text-white flex items-center gap-2">
          <img src="/logo.png" alt="RailSync" className="w-6 h-6 object-contain" />
          <span className="font-display font-bold">RailSync</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24">
          <div className="w-full max-w-lg">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold mb-2">{title}</h2>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
        <div className="mt-auto shrink-0">
          <OperationalDisclaimer />
        </div>
      </div>
    </div>
  );
}
