import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '../hooks/useUpload';
import { UploadCloud } from 'lucide-react';

export function UploadDropzone({ children, currentFolderId }) {
  const { uploadFiles } = useUpload();

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
    <div {...getRootProps()} className="relative flex-1 flex flex-col h-full w-full outline-none">
      <input {...getInputProps()} />
      
      {children}

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-50/90 dark:bg-brand-950/90 backdrop-blur-sm border-2 border-dashed border-brand-500 m-2 rounded-xl">
          <div className="bg-surface-0 dark:bg-surface-900 p-6 rounded-full shadow-lg mb-4">
            <UploadCloud className="w-12 h-12 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-100">Drop files here to upload</h3>
          <p className="text-brand-700 dark:text-brand-300 mt-2">Files will be uploaded to the current folder</p>
        </div>
      )}
    </div>
  );
}
