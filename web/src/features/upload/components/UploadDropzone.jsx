import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '../hooks/useUpload';
import { useTransfers } from '../hooks/useTransfers';
import { UploadCloud } from 'lucide-react';

export function UploadDropzone({ children, currentFolderId }) {
  const { uploadFiles } = useUpload();
  const { uploadLocalToCloud } = useTransfers();
  const [isHtml5DragOver, setIsHtml5DragOver] = useState(false);
  const dragCounter = useRef(0);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        uploadFiles(acceptedFiles, currentFolderId);
      }
    },
    [uploadFiles, currentFolderId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // We only want drop, not click-to-open-dialog since we have a dedicated button
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className="relative flex-1 flex flex-col h-full w-full outline-none"
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounter.current += 1;
        setIsHtml5DragOver(true);
      }}
      onDragOver={(e) => {
        // Dropzone's getRootProps overrides this if it's native files,
        // but for synthetic drag, we catch it here.
        e.preventDefault();
      }}
      onDragLeave={(e) => {
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
          setIsHtml5DragOver(false);
        }
      }}
      onDrop={(e) => {
        dragCounter.current = 0;
        setIsHtml5DragOver(false);
        const dataStr = e.dataTransfer.getData('application/json');
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'LOCAL_FILE') {
              const mimeType = 'application/octet-stream';
              uploadLocalToCloud(data.path, data.name, mimeType, data.size, currentFolderId);
            }
          } catch (err) {
            console.error('Invalid drop data', err);
          }
        }
      }}
    >
      <input {...getInputProps()} />
      
      {children}

      {/* Drag Overlay */}
      {(isDragActive || isHtml5DragOver) && (
        <div className="absolute inset-0 z-50 pointer-events-none border-2 border-dashed border-[#5D82A6] m-2 rounded-lg bg-[#5D82A6]/5 dark:bg-[#5D82A6]/10 transition-all duration-200">
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#5D82A6] text-white px-6 py-3 rounded-full shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
            <UploadCloud className="w-5 h-5" />
            <span className="font-medium text-sm">Drop to upload to current folder</span>
          </div>
        </div>
      )}
    </div>
  );
}
