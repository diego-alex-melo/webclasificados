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
  { href: '/oraculo', label: 'Metricas', icon: 'chart' },
  { href: '/oraculo/reportados', label: 'Anuncios', icon: 'flag' },
  { href: '/oraculo/usuarios', label: 'Usuarios', icon: 'users' },
  { href: '/oraculo/errores', label: 'Errores', icon: 'error' },
];

function NavIcon({ type }: { type: string }) {
  switch (type) {
    case 'chart':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
        </svg>
      );
    case 'flag':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      );
    case 'users':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'error':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminLayout({
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

    // Validate token + admin check
    fetch('/api/admin/check', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.data?.isAdmin) {
          router.replace('/');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-elevated flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function handleLogout() {
    localStorage.removeItem('token');
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-bg-elevated text-text-primary">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-accent-purple/15">
        <Link href="/oraculo" className="text-accent-gold font-bold text-lg">
          Admin Panel
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-text-primary"
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
          <nav className="absolute left-0 top-0 bottom-0 w-64 bg-bg-elevated border-r border-accent-purple/15 p-6 flex flex-col gap-2">
            <div className="mb-6">
              <span className="text-accent-gold font-bold text-lg">
                Admin Panel
              </span>
            </div>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-accent-purple/15 text-accent-gold'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <NavIcon type={item.icon} />
                {item.label}
              </Link>
            ))}
            <hr className="border-accent-purple/15 my-2" />
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
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
        <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-accent-purple/15 p-6 gap-2 sticky top-0 h-screen">
          <div className="mb-6">
            <Link href="/oraculo" className="text-accent-gold font-bold text-lg">
              Admin Panel
            </Link>
          </div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-accent-purple/15 text-accent-gold'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              <NavIcon type={item.icon} />
              {item.label}
            </Link>
          ))}
          <hr className="border-accent-purple/15 my-2" />
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          >
            Dashboard
          </Link>
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
        <main className="flex-1 p-4 lg:p-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
