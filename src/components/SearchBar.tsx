'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SearchBarProps {
  defaultValue?: string;
  large?: boolean;
}

export default function SearchBar({ defaultValue = '', large = false }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
          width={large ? 22 : 18}
          height={large ? 22 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar servicios esotéricos..."
          className={`w-full rounded-full border border-accent-purple/20 bg-bg-card pl-12 pr-4 text-text-primary placeholder:text-text-secondary/60 transition-all focus:border-accent-purple/50 focus:outline-none focus:ring-2 focus:ring-accent-purple/20 ${
            large ? 'py-4 text-lg' : 'py-2.5 text-sm'
          }`}
        />
        <button
          type="submit"
          className={`glow-gold absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-accent-gold px-4 font-medium text-bg-primary transition-all hover:bg-accent-gold-light ${
            large ? 'py-2 text-sm' : 'py-1.5 text-xs'
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
