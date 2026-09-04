const STEPS = [
  { number: '01', title: 'Install FileEX', desc: 'Download the FileEX installer for your operating system and run it. The application is self-contained and ready to use immediately.' },
  { number: '02', title: 'Sign in to your account', desc: 'Create a free account or sign in. Your cloud storage is tied to your account, so files are always available when you log in.' },
  { number: '03', title: 'Browse, organise and transfer', desc: 'Navigate your local filesystem on the Earth side and your cloud files on the Sky side. Move files between both environments in seconds.' },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-[88px] max-md:py-16 bg-surface border-t border-b border-border transition-colors duration-200"
      aria-labelledby="how-heading"
    >
      <div className="max-w-[1160px] mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-14">
          <p className="inline-flex text-xs font-semibold uppercase tracking-[0.08em] text-muted mb-3">Getting started</p>
          <h2 id="how-heading" className="text-[clamp(1.5rem,3vw,2.125rem)] font-bold tracking-[-0.02em] leading-[1.22] text-text mb-3.5">
            Up and running in minutes
          </h2>
          <p className="text-[1.0625rem] text-muted leading-relaxed">
            FileEX doesn't require configuration. Install, sign in and your files are right there.
          </p>
        </div>

        {/* Steps */}
        <ol
          role="list"
          className="
            grid grid-cols-3 max-md:grid-cols-1
            border border-border rounded-xl overflow-hidden
            bg-border gap-px
          "
        >
          {STEPS.map(({ number, title, desc }) => (
            <li key={number} className="bg-surface p-9 max-md:p-7 fade-up">
              <div className="text-[2rem] font-extrabold text-border tracking-[-0.04em] mb-5 leading-none tabular-nums">
                {number}
              </div>
              <h3 className="text-base font-[650] text-text mb-2.5 leading-tight">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
