import { Monitor, Cloud, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Concept() {
  const { dark } = useTheme();
  const earthBg = dark ? '/backgrounds/earth-dark.png'  : '/backgrounds/earth-light.png';
  const skyBg   = dark ? '/backgrounds/cloud-dark.png'  : '/backgrounds/cloud-light.png';

  return (
    <section
      className="py-16 bg-surface-2 border-t border-b border-border transition-colors duration-200"
      aria-labelledby="concept-heading"
    >
      <div className="max-w-[1160px] mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-12">
          <p className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.08em] text-muted mb-3">Core idea</p>
          <h2 id="concept-heading" className="text-[clamp(1.5rem,3vw,2.125rem)] font-bold tracking-[-0.02em] leading-[1.22] text-text mb-3.5">
            One workspace. Two environments.
          </h2>
          <p className="text-[1.0625rem] text-muted leading-relaxed">
            Most file managers live entirely on your machine. Cloud clients live in the browser.
            FileEX is the desktop application that puts both in the same place.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-[1fr_auto_1fr] max-md:grid-cols-1 border border-border rounded-[14px] overflow-hidden">

          {/* Earth / Local */}
          <div className="relative overflow-hidden min-h-[380px] max-md:min-h-[260px]">
            <img src={earthBg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" aria-hidden="true" />
            <div className={`absolute inset-0 ${dark ? 'bg-gradient-to-br from-[#1a2420]/92 via-[#1e2b26]/75 to-[#1a2420]/40' : 'bg-gradient-to-br from-[#F0F3F0]/92 via-[#DDE6DF]/70 to-[#DDE6DF]/40'}`} />
            <div className="relative z-10 p-9 h-full flex flex-col max-md:p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-earth-light text-earth mb-4 flex-shrink-0">
                <Monitor size={24} />
              </div>
              <h3 className="text-base font-bold text-earth mb-3 tracking-[-0.01em]">Local — Earth</h3>
              <p className="text-[0.9rem] text-muted leading-relaxed mb-5 max-w-[360px]">
                Your machine. Full filesystem navigation, clipboard operations, drag-and-drop, and right-click context menus — all natively, all inside FileEX.
              </p>
              <ul role="list" className="mt-auto flex flex-col gap-1.5">
                {['Full filesystem access', 'Cut, copy, paste operations', 'Create & rename folders', 'Drag files to the cloud'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[0.8375rem] text-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-earth opacity-50 flex-shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bridge */}
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 bg-surface border-l border-r border-border min-w-[72px] max-md:flex-row max-md:border-t max-md:border-b max-md:border-l-0 max-md:border-r-0 max-md:min-w-0 max-md:px-6 max-md:py-4">
            <div className="flex flex-col gap-1 text-muted max-md:flex-row">
              <ArrowRight size={18} />
              <ArrowRight size={18} className="opacity-50" />
            </div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-subtle [writing-mode:vertical-rl] max-md:[writing-mode:horizontal-tb]">
              FileEX
            </span>
          </div>

          {/* Sky / Cloud */}
          <div className="relative overflow-hidden min-h-[380px] max-md:min-h-[260px]">
            <img src={skyBg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" aria-hidden="true" />
            <div className={`absolute inset-0 ${dark ? 'bg-gradient-to-br from-[#141c24]/92 via-[#1a2535]/75 to-[#141c24]/40' : 'bg-gradient-to-br from-[#EDF3F9]/92 via-[#DDE8F2]/70 to-[#DDE8F2]/40'}`} />
            <div className="relative z-10 p-9 h-full flex flex-col max-md:p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-light text-sky mb-4 flex-shrink-0">
                <Cloud size={24} />
              </div>
              <h3 className="text-base font-bold text-sky mb-3 tracking-[-0.01em]">Cloud — Sky</h3>
              <p className="text-[0.9rem] text-muted leading-relaxed mb-5 max-w-[360px]">
                Your remote storage. Upload, download, organise and search cloud files the same way you would local ones — no browser required.
              </p>
              <ul role="list" className="mt-auto flex flex-col gap-1.5">
                {['Cloud file browsing', 'Upload from local', 'Download to machine', 'Secure authenticated access'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[0.8375rem] text-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky opacity-50 flex-shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
