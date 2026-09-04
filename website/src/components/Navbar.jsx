import { useState } from 'react';
import { Menu, X, Download } from 'lucide-react';
import { SITE, DOWNLOADS, WEB_APP } from '../config';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Download',     href: '#download' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const hasDownload = Object.values(DOWNLOADS).some(Boolean);

  return (
    <header className="
      fixed top-0 left-0 right-0 z-50
      bg-bg/90 backdrop-blur-md
      border-b border-border
      transition-colors duration-200
    ">
      <div className="max-w-[1160px] mx-auto px-6 flex items-center justify-between h-[58px] gap-6">

        {/* Logo */}
        <a href="#" aria-label="FileEX home" className="flex items-center gap-2 flex-shrink-0 no-underline">
          <span
            aria-hidden="true"
            className="
              inline-flex items-center justify-center w-[30px] h-[30px]
              rounded-[7px] bg-earth text-white font-bold text-base
              transition-colors duration-200
            "
          >F</span>
          <span className="text-[1.0625rem] font-[650] text-text tracking-[-0.01em] transition-colors duration-200">
            {SITE.name}
          </span>
        </a>

        {/* Desktop nav links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="
                px-3 py-1.5 text-sm text-muted rounded-md
                hover:text-text hover:bg-surface-2
                transition-colors duration-150 no-underline
              "
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Auth links */}
          <a
            href={WEB_APP.login}
            target="_blank"
            rel="noopener noreferrer"
            className="
              px-3 py-1.5 text-sm text-muted rounded-md
              hover:text-text hover:bg-surface-2
              transition-colors duration-150 no-underline
            "
          >
            Login
          </a>
          <a
            href={WEB_APP.register}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md
              bg-sky-light text-sky
              hover:bg-sky hover:text-white
              border border-sky/30 hover:border-sky
              transition-all duration-150 no-underline
            "
          >
            Register
          </a>

          <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />

          <ThemeToggle />

          {/* Download CTA */}
          <a
            href="#download"
            aria-disabled={!hasDownload}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md',
              'bg-earth text-white hover:bg-earth-hover',
              'transition-colors duration-150 no-underline',
              !hasDownload ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
            ].join(' ')}
          >
            <Download size={14} aria-hidden="true" />
            Download FileEX
          </a>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="
              flex items-center justify-center w-9 h-9 rounded-md
              text-text hover:bg-surface-2
              transition-colors duration-150 border-0 bg-transparent cursor-pointer
            "
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="
            md:hidden border-t border-border
            bg-bg/97 backdrop-blur-md
            transition-colors duration-200
          "
        >
          <nav className="flex flex-col gap-0.5 px-5 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="
                  block px-3 py-2.5 text-[0.9375rem] text-text rounded-md
                  hover:bg-surface-2 transition-colors duration-150 no-underline
                "
              >
                {l.label}
              </a>
            ))}

            {/* Mobile auth links */}
            <hr className="border-border my-2" />
            <a
              href={WEB_APP.login}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-[0.9375rem] text-muted rounded-md hover:bg-surface-2 transition-colors duration-150 no-underline"
            >
              Login
            </a>
            <a
              href={WEB_APP.register}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-[0.9375rem] font-medium text-sky rounded-md hover:bg-surface-2 transition-colors duration-150 no-underline"
            >
              Register
            </a>

            {/* Mobile download */}
            <a
              href="#download"
              onClick={() => setOpen(false)}
              aria-disabled={!hasDownload}
              className={[
                'mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md',
                'text-[0.9375rem] font-medium text-white bg-earth',
                'hover:bg-earth-hover transition-colors duration-150 no-underline',
                !hasDownload ? 'opacity-50 pointer-events-none' : '',
              ].join(' ')}
            >
              <Download size={16} aria-hidden="true" />
              Download FileEX
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
