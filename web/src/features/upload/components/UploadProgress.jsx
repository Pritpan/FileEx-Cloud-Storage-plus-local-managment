import { Progress } from '@/components/ui/progress';

export function UploadProgress({ value, className, indicatorClassName }) {
  return (
    <Progress value={value} className={`h-2 ${className || ''}`} indicatorClassName={indicatorClassName} />
  );
}
