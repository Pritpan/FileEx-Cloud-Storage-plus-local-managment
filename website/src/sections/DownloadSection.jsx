import { Download, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { DOWNLOADS, SITE } from '../config';

const PLATFORM_LABELS = {
  windows: 'Download for Windows',
  mac: 'Download for macOS',
  linux: 'Download for Linux',
};

export function DownloadSection() {
  const { dark } = useTheme();
  const platforms = Object.entries(DOWNLOADS).filter(([, url]) => Boolean(url));
  const hasAny = platforms.length > 0;
  const bgImg = dark ? '/backgrounds/earth-dark.png' : '/backgrounds/earth-light.png';

  return (
    <section
      id="download"
      className="relative py-[88px] max-md:py-16 overflow-hidden text-center scroll-mt-[58px] transition-colors duration-200"
      style={{ background: 'var(--bg)' }}
      aria-labelledby="download-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img src={bgImg} alt="" className="w-full h-full object-cover object-[center_top]" loading="lazy" style={{ opacity: dark ? 0.15 : 0.32 }} />
        <div className={`absolute inset-0 ${dark
          ? 'bg-gradient-to-b from-[#141817]/60 to-[#141817]/95'
          : 'bg-gradient-to-b from-[#F6F6F2]/55 to-[#F6F6F2]/92'
        }`} />
      </div>

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-[18px] bg-earth-light text-earth mx-auto mb-5">
          <Monitor size={36} />
        </div>

        <p className="inline-flex items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] text-earth mb-4">
          Desktop application
        </p>

        <h2
          id="download-heading"
          className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.02em] text-text mb-3.5 leading-[1.22]"
        >
          Get {SITE.name} for your computer
        </h2>
        <p className="text-[1.0625rem] text-muted max-w-[480px] mx-auto mb-9 leading-relaxed" style={{ opacity: 0.85 }}>
          {SITE.name} is a native desktop application. Install it on your machine
          and your local and cloud files are always one click away.
        </p>

        {hasAny ? (
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {platforms.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                download
                className="
                  inline-flex items-center gap-2 px-6 py-3.5 rounded-[9px] text-base font-medium
                  bg-earth text-white hover:bg-earth-hover
                  transition-colors duration-150 no-underline active:translate-y-px
                "
              >
                <Download size={18} aria-hidden="true" />
                {PLATFORM_LABELS[platform]}
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="
              inline-flex items-center gap-2.5 px-6 py-3.5
              rounded-[9px] bg-surface-2 border border-border
              text-muted text-base font-medium
            ">
              <Download size={20} aria-hidden="true" />
              <span>Windows installer coming soon</span>
            </div>
            <p className="text-[0.8125rem] text-subtle max-w-[420px] leading-relaxed">
              Set <code className="font-mono text-[0.78rem] bg-surface-2 border border-border rounded px-1 py-px text-text">VITE_DOWNLOAD_URL_WINDOWS</code> in <code className="font-mono text-[0.78rem] bg-surface-2 border border-border rounded px-1 py-px text-text">website/.env</code> to activate the download button.
            </p>
          </div>
        )}

        <ul role="list" aria-label="Download highlights" className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-[0.8375rem] text-muted">
          {['Free to download', 'Self-contained installer', 'Works on Windows'].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-earth flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
