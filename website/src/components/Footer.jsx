import { ExternalLink } from 'lucide-react';
import { SITE, DOWNLOADS, WEB_APP } from '../config';

function GithubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

const PRODUCT_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Download',     href: '#download' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border pt-14 transition-colors duration-200">
      <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-[1.8fr_1fr_1fr] max-md:grid-cols-2 max-sm:grid-cols-1 gap-10 pb-12">

        {/* Brand */}
        <div className="max-w-[280px] max-md:col-span-2 max-sm:col-span-1 max-md:max-w-full">
          <a href="#" aria-label="FileEX home" className="inline-flex items-center gap-2 mb-3.5 no-underline">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-[5px] bg-earth text-white font-bold text-[0.8125rem] flex-shrink-0">F</span>
            <span className="text-[0.9375rem] font-[650] text-text tracking-[-0.01em]">{SITE.name}</span>
          </a>
          <p className="text-sm text-muted leading-relaxed">{SITE.description}</p>
        </div>

        {/* Product links */}
        <nav aria-label="Footer product navigation" className="flex flex-col">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-subtle mb-3.5">Product</p>
          {PRODUCT_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="py-1 text-sm text-muted hover:text-text transition-colors duration-150 no-underline">
              {l.label}
            </a>
          ))}
          {SITE.docsUrl && (
            <a href={SITE.docsUrl} target="_blank" rel="noopener noreferrer" className="py-1 text-sm text-muted hover:text-text transition-colors duration-150 no-underline inline-flex items-center gap-1">
              Documentation
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </nav>

        {/* Resources */}
        <nav aria-label="Footer resources" className="flex flex-col">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-subtle mb-3.5">Resources</p>
          <a href={WEB_APP.login} target="_blank" rel="noopener noreferrer" className="py-1 text-sm text-muted hover:text-text transition-colors duration-150 no-underline">Login</a>
          <a href={WEB_APP.register} target="_blank" rel="noopener noreferrer" className="py-1 text-sm text-muted hover:text-text transition-colors duration-150 no-underline">Register</a>
          <a href="#download" className="py-1 text-sm text-muted hover:text-text transition-colors duration-150 no-underline">Download</a>
          <a href="#how-it-works" className="py-1 text-sm text-muted hover:text-text transition-colors duration-150 no-underline">Getting Started</a>
          {SITE.github && (
            <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="py-1 text-sm text-muted hover:text-text transition-colors duration-150 no-underline inline-flex items-center gap-1">
              <GithubIcon size={13} />
              GitHub
            </a>
          )}
        </nav>
      </div>

      {/* Copyright */}
      <div className="max-w-[1160px] mx-auto px-6 border-t border-border py-5">
        <p className="text-center text-[0.8rem] text-subtle">
          © {year} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
