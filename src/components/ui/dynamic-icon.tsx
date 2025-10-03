import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { lazy, Suspense } from 'react';
import { Skeleton } from './skeleton';

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export function DynamicIcon({ name, size = 24, ...props }: DynamicIconProps) {
  const iconName = name.toLowerCase().replace(/\s+/g, '-');
  
  // Stable fallback with exact dimensions
  const fallback = <Skeleton className="rounded" style={{ width: size, height: size, minWidth: size, minHeight: size }} />;
  
  // Validate icon exists before lazy loading
  if (!iconName || !(iconName in dynamicIconImports)) {
    return fallback;
  }
  
  try {
    const LucideIcon = lazy(dynamicIconImports[iconName as keyof typeof dynamicIconImports]);
    
    return (
      <Suspense fallback={fallback}>
        <LucideIcon size={size} {...props} />
      </Suspense>
    );
  } catch (error) {
    console.error(`Failed to load icon: ${iconName}`, error);
    return fallback;
  }
}
