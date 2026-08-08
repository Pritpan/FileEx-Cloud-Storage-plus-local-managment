import { Progress } from '@/components/ui/progress';

export function UploadProgress({ value, className }) {
  return (
    <Progress value={value} className={`h-2 ${className || ''}`} />
  );
}
