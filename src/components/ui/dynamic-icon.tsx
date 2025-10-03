import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { lazy, Suspense } from 'react';

const fallback = <div className="w-6 h-6" />;

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const iconName = name.toLowerCase().replace(/\s+/g, '-');
  
  // Validate icon exists before lazy loading
  if (!iconName || !(iconName in dynamicIconImports)) {
    return fallback;
  }
  
  try {
    const LucideIcon = lazy(dynamicIconImports[iconName as keyof typeof dynamicIconImports]);
    
    return (
      <Suspense fallback={fallback}>
        <LucideIcon {...props} />
      </Suspense>
    );
  } catch (error) {
    console.error(`Failed to load icon: ${iconName}`, error);
    return fallback;
  }
}
