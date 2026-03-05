'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Metricas', icon: 'chart' },
  { href: '/dashboard/anuncio', label: 'Mi Anuncio', icon: 'ad' },
  { href: '/dashboard/referidos', label: 'Referidos', icon: 'referral' },
  { href: '/dashboard/badge', label: 'Sello', icon: 'badge' },
];

function NavIcon({ type }: { type: string }) {
  switch (type) {
    case 'chart':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
        </svg>
      );
    case 'ad':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 17V7l8 10V7" />
        </svg>
      );
    case 'referral':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'badge':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Validate token with a lightweight request
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('token');
          router.replace('/login');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.replace('/login');
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0d0015] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function handleLogout() {
    localStorage.removeItem('token');
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-[#0d0015] text-[#e8e0f0]">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-[#1a0e2e]">
        <Link href="/dashboard" className="text-[#d4af37] font-bold text-lg">
          BrujosClassifieds
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-[#e8e0f0]"
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>
            )}
          </svg>
        </button>
      </header>

      {/* Mobile slide menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute left-0 top-0 bottom-0 w-64 bg-[#0d0015] border-r border-[#1a0e2e] p-6 flex flex-col gap-2">
            <div className="mb-6">
              <span className="text-[#d4af37] font-bold text-lg">
                BrujosClassifieds
              </span>
            </div>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-[#7b2ff2]/15 text-[#d4af37]'
                    : 'text-[#a090b8] hover:bg-[#1a0e2e] hover:text-[#e8e0f0]'
                }`}
              >
                <NavIcon type={item.icon} />
                {item.label}
              </Link>
            ))}
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors w-full"
              >
                Cerrar sesion
              </button>
            </div>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-[#1a0e2e] p-6 gap-2 sticky top-0 h-screen">
          <div className="mb-6">
            <Link href="/dashboard" className="text-[#d4af37] font-bold text-lg">
              BrujosClassifieds
            </Link>
          </div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-[#7b2ff2]/15 text-[#d4af37]'
                  : 'text-[#a090b8] hover:bg-[#1a0e2e] hover:text-[#e8e0f0]'
              }`}
            >
              <NavIcon type={item.icon} />
              {item.label}
            </Link>
          ))}
          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors w-full"
            >
              Cerrar sesion
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
