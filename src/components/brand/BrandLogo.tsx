import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export function BrandLogo({
  href,
  size = 'md',
  showTagline = false,
  iconOnly = false,
  className = '',
}: BrandLogoProps) {
  const iconSizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-14 w-14 rounded-2xl',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative shrink-0 overflow-hidden border border-cyan-400/35 bg-slate-950 shadow-neon-cyan ${iconSizes[size]}`}
      >
        <img
          src="/brand/tgc-icon.png"
          alt="Ícone oficial The Game Center"
          className="h-full w-full object-cover"
        />
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-display font-bold uppercase tracking-wider text-white ${titleSizes[size]}`}
          >
            The Game <span className="text-tgc-primary">Center</span>
          </span>
          {showTagline && (
            <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Personal Library &amp; Social Nexus
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
