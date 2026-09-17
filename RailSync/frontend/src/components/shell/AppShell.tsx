import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { OperationalDisclaimer } from './OperationalDisclaimer';

export function AppShell() {
  const { signOut, profile } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-shell-bg)]">
      <header className="bg-[var(--color-shell-nav)] text-white h-14 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-display font-bold text-lg tracking-wide flex items-center gap-2">
            <img src="/logo.png" alt="RailSync" className="w-7 h-7 object-contain" />
            RailSync
          </div>
          <nav className="flex gap-4 ml-6 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-white transition-colors">Overview</Link>
            <Link to="/intake" className="hover:text-white transition-colors">Data intake</Link>
            <Link to="/feasibility" className="hover:text-white transition-colors">Feasibility</Link>
            <Link to="/priority" className="hover:text-white transition-colors">Priority</Link>
            <Link to="/planner" className="hover:text-white transition-colors">Block plan</Link>
            <Link to="/operations-data" className="hover:text-white transition-colors">Operations data</Link>
            <Link to="/what-if" className="hover:text-white transition-colors">What-if</Link>
            <Link to="/live-monitor" className="hover:text-white transition-colors">Live monitor</Link>
            <Link to="/cockpit" className="hover:text-white transition-colors">Cockpit</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="px-2 py-1 bg-white/10 rounded text-xs font-mono">UTC: 2026-09-17 18:53</div>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">{profile?.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'U'}</div>
          <button onClick={() => signOut()} className="text-xs font-medium text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors">Sign out</button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <footer className="shrink-0 mt-auto">
        <OperationalDisclaimer />
      </footer>
    </div>
  );
}
