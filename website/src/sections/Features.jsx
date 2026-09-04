import {
  FolderOpen, Cloud, Upload, Download, Search,
  ArrowUpDown, LayoutGrid, Scissors, ShieldCheck,
} from 'lucide-react';

const FEATURES = [
  { icon: FolderOpen,  color: 'earth', title: 'Local File Management', desc: 'Browse and navigate your entire file system. Create, rename, delete and organise folders just as you would in any native file manager.' },
  { icon: Cloud,       color: 'sky',   title: 'Cloud Storage',          desc: 'Access your cloud-stored files alongside local ones. Files live on the server, visible and manageable right inside FileEX.' },
  { icon: Upload,      color: 'sky',   title: 'Upload to Cloud',        desc: 'Select any local file and push it to the cloud with a single click. Progress is tracked and transfers run in the background.' },
  { icon: Download,    color: 'earth', title: 'Download to Local',      desc: 'Pull cloud files straight to your machine from within the app. No browser or external tool required.' },
  { icon: Search,      color: 'neutral', title: 'Search',               desc: 'Full-text-text search across your local directory (recursive, depth-6) and cloud files. Results update as you type.' },
  { icon: ArrowUpDown, color: 'neutral', title: 'File Sorting',         desc: 'Sort by Name, Size, Type or Date Modified — ascending or descending. Folders always appear before files.' },
  { icon: LayoutGrid,  color: 'neutral', title: 'Grid & List Views',    desc: 'Switch between a compact list table with sortable columns or a spacious grid layout, whichever suits your workflow.' },
  { icon: Scissors,    color: 'earth', title: 'File Operations',        desc: 'Cut, copy, paste, rename, delete and move files on your local machine using a familiar context-menu interface.' },
  { icon: ShieldCheck, color: 'sky',   title: 'Secure Authentication',  desc: 'JWT-based login with email verification ensures only you access your cloud storage. Tokens are refreshed automatically.' },
];

const ICON_CLASSES = {
  earth:   'bg-earth-light text-earth',
  sky:     'bg-sky-light   text-sky',
  neutral: 'bg-surface-2   text-muted',
};

export function Features() {
  return (
    <section id="features" className="py-[88px] max-md:py-16 transition-colors duration-200" aria-labelledby="features-heading">
      <div className="max-w-[1160px] mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-14">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted mb-3">Product</p>
          <h2 id="features-heading" className="text-[clamp(1.5rem,3vw,2.125rem)] font-bold tracking-[-0.02em] leading-[1.22] text-text mb-3.5">
            Everything you need in one place
          </h2>
          <p className="text-[1.0625rem] text-muted leading-relaxed">
            FileEX ships with a focused set of tools built around the way desktop users actually manage files.
          </p>
        </div>

        {/* Grid */}
        <ul
          role="list"
          className="
            grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1
            border border-border rounded-xl overflow-hidden
            divide-x divide-y divide-border
            [&>li:nth-child(3n+1)]:border-l-0
            bg-border
            gap-px
          "
        >
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <li key={title} className="bg-surface p-7 hover:bg-surface-2 transition-colors duration-150 border-0">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-[9px] mb-4 ${ICON_CLASSES[color]}`} aria-hidden="true">
                <Icon size={20} />
              </div>
              <h3 className="text-[0.9375rem] font-[650] text-text mb-2 leading-tight">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
