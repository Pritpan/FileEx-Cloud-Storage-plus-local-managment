import { Clock, Loader2, AlertTriangle, File, Image, FileText, FileCode, FileArchive, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecentFiles } from '../hooks/useRecentFiles';
import { formatBytes, formatDate } from '@/features/explorer/components/ExplorerItem';
import { useDownload } from '@/features/preview/hooks/useDownload';

// ── File type icon helper ────────────────────────────────────────────────────
function getIcon(mimeType) {
  if (!mimeType) return <File className="w-5 h-5 text-surface-400" />;
  if (mimeType.startsWith('image/'))  return <Image className="w-5 h-5 text-emerald-500" />;
  if (mimeType.startsWith('video/'))  return <Video className="w-5 h-5 text-purple-500" />;
  if (mimeType.startsWith('audio/'))  return <Music className="w-5 h-5 text-pink-500" />;
  if (mimeType.startsWith('text/'))   return <FileText className="w-5 h-5 text-blue-500" />;
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('tar'))
                                       return <FileArchive className="w-5 h-5 text-amber-500" />;
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html'))
                                       return <FileCode className="w-5 h-5 text-indigo-500" />;
  return <File className="w-5 h-5 text-surface-400" />;
}

// ── File Row ─────────────────────────────────────────────────────────────────
function RecentFileRow({ item }) {
  const { download, isDownloading } = useDownload();

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group rounded-md">
      <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/10 shrink-0">
        {getIcon(item.mimeType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground dark:text-white truncate">
          {item.displayName}
        </p>
        <p className="text-xs text-foreground/60 dark:text-white/60 mt-0.5">
          {formatDate(item.createdAt)}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <span className="text-xs text-foreground/50 dark:text-white/50 hidden sm:block">
          {formatBytes(item.size)}
        </span>
        <Badge variant="outline" className="text-xs font-normal capitalize hidden md:flex">
          {item.mimeType?.split('/')[1] ?? 'file'}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => download(item.id, item.displayName)}
          disabled={isDownloading}
          className="h-8 px-3 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Download
        </Button>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
      <div className="p-6 rounded-full glass-card shadow-none">
        <Clock className="w-12 h-12 text-foreground/40 dark:text-white/40" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground/80 dark:text-white/80">No recent files</p>
        <p className="text-sm text-foreground/60 dark:text-white/60 mt-1">Files you upload will appear here.</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function RecentPage() {
  const { items, isLoading, isError, refetch } = useRecentFiles();

  return (
    <div className="flex flex-col h-full w-full glass-workspace">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 glass-identity shrink-0">
        <Clock className="w-5 h-5 text-foreground/60 dark:text-white/60" />
        <div>
          <h1 className="text-base font-semibold text-foreground dark:text-white">Recent</h1>
          {!isLoading && !isError && (
            <p className="text-xs text-foreground/60 dark:text-white/60">{items.length} recent file{items.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-7 h-7 animate-spin text-surface-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-foreground/60 dark:text-white/60">Failed to load recent files.</p>
            <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="px-3 py-3">
            <div className="glass-card rounded-xl overflow-hidden">
              {items.map((item, idx) => (
                <div key={item.id}>
                  <RecentFileRow item={item} />
                  {idx < items.length - 1 && (
                    <div className="mx-6 h-px bg-black/10 dark:bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
