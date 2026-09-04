import { ArrowDown, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SITE, DOWNLOADS, WEB_APP } from '../config';

export function Hero() {
  const { dark } = useTheme();
  const primaryDownload = DOWNLOADS.windows || DOWNLOADS.mac || DOWNLOADS.linux;

  const heroBg     = dark ? '/backgrounds/earth-dark.png'  : '/backgrounds/cloud-light.png';
  const localBg    = dark ? '/backgrounds/earth-dark.png'  : '/backgrounds/earth-light.png';
  const cloudBg    = dark ? '/backgrounds/cloud-dark.png'  : '/backgrounds/cloud-light.png';

  return (
    <section
      className="relative min-h-svh flex flex-col justify-center overflow-hidden"
      style={{ paddingTop: '58px' }}
      aria-labelledby="hero-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img src={heroBg} alt="" className="w-full h-full object-cover object-center" loading="eager" />
        <div className={[
          'absolute inset-0',
          dark
            ? 'bg-gradient-to-r from-[#141817]/92 via-[#141817]/70 to-[#141817]/20'
            : 'bg-gradient-to-r from-[#F6F6F2]/90 via-[#F6F6F2]/65 to-[#F6F6F2]/15',
        ].join(' ')} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1160px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center pt-12 pb-20">

        {/* Text */}
        <div className="max-w-[520px]">
          <p className="fade-up inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-sky mb-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky" aria-hidden="true" />
            Desktop file manager
          </p>

          <h1 id="hero-heading" className="fade-up fade-up-delay-1 text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.18] tracking-[-0.025em] text-text mb-5">
            {SITE.tagline}
          </h1>

          <p className="fade-up fade-up-delay-2 text-[1.0625rem] text-muted leading-relaxed mb-8 max-w-[440px]">
            {SITE.description} Browse, organise and transfer files between your
            machine and cloud storage — all from one clean desktop application.
          </p>

          <div className="fade-up fade-up-delay-3 flex flex-wrap gap-3 mb-5">
            {primaryDownload ? (
              <a
                href={primaryDownload}
                download
                className="
                  inline-flex items-center gap-2 px-6 py-3.5 rounded-[9px] text-base font-medium
                  bg-earth text-white hover:bg-earth-hover
                  transition-colors duration-150 no-underline active:translate-y-px
                "
              >
                <Download size={18} aria-hidden="true" />
                Download for Windows
              </a>
            ) : (
              <span
                title="Download coming soon"
                aria-label="Download FileEX — coming soon"
                className="
                  inline-flex items-center gap-2 px-6 py-3.5 rounded-[9px] text-base font-medium
                  bg-earth text-white opacity-50 cursor-not-allowed
                "
              >
                <Download size={18} aria-hidden="true" />
                Download FileEX
              </span>
            )}

            {/* Open web app */}
            <a
              href={WEB_APP.app}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-2 px-6 py-3.5 rounded-[9px] text-base font-medium
                bg-transparent text-text border border-border
                hover:bg-surface-2 hover:border-text-muted
                transition-all duration-150 no-underline active:translate-y-px
              "
            >
              Open FileEX Web
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>

          {!primaryDownload && (
            <p className="fade-up fade-up-delay-4 text-[0.8125rem] text-muted">
              Release build coming soon —{' '}
              <a href="#download" className="text-sky underline underline-offset-2">
                learn more ↓
              </a>
            </p>
          )}
        </div>

        {/* App preview */}
        <div className="fade-up fade-up-delay-3 flex justify-end" aria-label="FileEX application preview">
          <div className="w-full max-w-[520px] rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.14),0_32px_64px_rgba(0,0,0,0.08)] bg-surface">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-surface-2 border-b border-border" aria-hidden="true">
              <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
              <span className="ml-2 flex-1 text-center text-[0.72rem] text-muted pr-12">FileEX</span>
            </div>
            {/* Composite panels */}
            <div className="grid grid-cols-2 h-[280px]">
              <div className="relative overflow-hidden border-r border-white/20">
                <img src={localBg} alt="Local (Earth) file browser" className="w-full h-full object-cover" />
                <span className="
                  absolute bottom-3 left-3 flex items-center gap-1.5
                  text-[0.6875rem] font-semibold tracking-wide
                  px-2 py-1 rounded-full
                  bg-bg/85 backdrop-blur-sm text-earth
                ">
                  <span className="w-1.5 h-1.5 rounded-full bg-earth" aria-hidden="true" />
                  Local — Earth
                </span>
              </div>
              <div className="relative overflow-hidden">
                <img src={cloudBg} alt="Cloud (Sky) file browser" className="w-full h-full object-cover" />
                <span className="
                  absolute bottom-3 left-3 flex items-center gap-1.5
                  text-[0.6875rem] font-semibold tracking-wide
                  px-2 py-1 rounded-full
                  bg-bg/85 backdrop-blur-sm text-sky
                ">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky" aria-hidden="true" />
                  Cloud — Sky
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#features"
        aria-label="Scroll to features"
        className="
          absolute bottom-7 left-1/2 -translate-x-1/2 z-10
          flex items-center justify-center w-9 h-9 rounded-full
          border border-border bg-bg/70 backdrop-blur-sm
          text-muted hover:border-sky hover:text-sky
          transition-all duration-150 no-underline
          [animation:scrollBob_2.4s_ease-in-out_infinite]
        "
      >
        <ArrowDown size={18} />
      </a>
    </section>
  );
}
