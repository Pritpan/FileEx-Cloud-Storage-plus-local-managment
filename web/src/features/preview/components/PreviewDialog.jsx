import { useState, useEffect } from 'react';
import { AlertTriangle, Download, FileX, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getPreviewType } from '../utils/previewType';
import { useDownload } from '../hooks/useDownload';

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function ImagePreview({ url, name }) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-checkerboard rounded-md overflow-hidden">
      <img
        src={url}
        alt={name}
        className="max-w-full max-h-full object-contain rounded"
      />
    </div>
  );
}

function PdfPreview({ url }) {
  return (
    <iframe
      src={url}
      title="PDF Preview"
      className="w-full h-full rounded border-0"
    />
  );
}

function TextPreview({ url }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(url)
      .then((r) => r.text())
      .then((t) => { if (!cancelled) { setText(t); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  if (loading) return <PreviewLoader />;
  if (error) return <PreviewError message="Could not load text content." />;
  return (
    <pre className="w-full h-full overflow-auto text-xs font-mono text-surface-800 dark:text-surface-200 bg-surface-50 dark:bg-surface-900 p-4 rounded-md whitespace-pre-wrap break-all leading-relaxed">
      {text}
    </pre>
  );
}

function UnsupportedPreview({ item, onDownload }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="p-5 bg-surface-100 dark:bg-surface-800 rounded-full">
        <FileX className="w-12 h-12 text-surface-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-surface-900 dark:text-surface-100">
          Preview not available
        </p>
        <p className="text-sm text-surface-500 mt-1">
          This file type cannot be previewed in the browser.
        </p>
      </div>
      <Button onClick={() => onDownload(item)}>
        <Download className="w-4 h-4 mr-2" />
        Download file
      </Button>
    </div>
  );
}

function PreviewLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-surface-400">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-sm">Loading preview…</span>
    </div>
  );
}

function PreviewError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <p className="text-sm text-surface-500">{message || 'Something went wrong.'}</p>
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

/**
 * PreviewDialog
 *
 * @param {{ open, onOpenChange, item, previewUrl, isLoading, isError }} props
 */
export function PreviewDialog({ open, onOpenChange, item, previewUrl, isLoading, isError }) {
  const { downloadFile } = useDownload();

  const previewType = item ? getPreviewType(item) : null;

  const renderContent = () => {
    if (isLoading) return <PreviewLoader />;
    if (isError) return <PreviewError message="Could not load preview. The file may not be available." />;
    if (!previewUrl) return null;

    switch (previewType) {
      case 'image': return <ImagePreview url={previewUrl} name={item.displayName} />;
      case 'pdf':   return <PdfPreview url={previewUrl} />;
      case 'text':  return <TextPreview url={previewUrl} />;
      default:      return <UnsupportedPreview item={item} onDownload={downloadFile} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 shrink-0">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="truncate text-base font-semibold max-w-[calc(100%-120px)]" title={item?.displayName}>
              {item?.displayName}
            </DialogTitle>
            {item && previewType !== 'unsupported' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(item)}
                className="shrink-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden p-4 bg-surface-50 dark:bg-surface-950">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
