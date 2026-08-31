import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '../hooks/useUpload';
import { useTransfers } from '../hooks/useTransfers';
import { UploadCloud } from 'lucide-react';

export function UploadDropzone({ children, currentFolderId }) {
  const { uploadFiles } = useUpload();
  const { uploadLocalToCloud } = useTransfers();
  const [isHtml5DragOver, setIsHtml5DragOver] = useState(false);

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
      onDragOver={(e) => {
        // Dropzone's getRootProps overrides this if it's native files,
        // but for synthetic drag, we catch it here.
        e.preventDefault();
        setIsHtml5DragOver(true);
      }}
      onDragLeave={() => setIsHtml5DragOver(false)}
      onDrop={(e) => {
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
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-50/95 dark:bg-brand-950/90 backdrop-blur-sm border-2 border-dashed border-brand-600 m-2 rounded-md">
          <div className="bg-surface-0 dark:bg-surface-800 p-6 rounded-full shadow-sm mb-4">
            <UploadCloud className="w-12 h-12 text-brand-600" />
          </div>
          <h3 className="text-xl font-semibold text-brand-600 dark:text-brand-400">Drop files here to upload</h3>
          <p className="text-brand-600/70 dark:text-brand-400/70 mt-1 text-sm">Files will be uploaded to the current folder</p>
        </div>
      )}
    </div>
  );
}
