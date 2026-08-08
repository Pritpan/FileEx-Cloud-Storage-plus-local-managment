import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpload } from '../hooks/useUpload';

export function UploadButton({ currentFolderId }) {
  const fileInputRef = useRef(null);
  const { uploadFiles } = useUpload();

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files, currentFolderId);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />
      <Button
        variant="default"
        className="bg-brand-600 hover:bg-brand-700 text-white"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>
    </>
  );
}
