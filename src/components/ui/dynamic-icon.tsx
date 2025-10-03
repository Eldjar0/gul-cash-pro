import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { lazy, Suspense, useMemo, memo } from 'react';

const fallback = <div className="w-6 h-6" />;

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export const DynamicIcon = memo(({ name, ...props }: DynamicIconProps) => {
  const iconName = name.toLowerCase().replace(/\s+/g, '-');
  
  // Memoize the lazy component to prevent re-creation on every render
  const LucideIcon = useMemo(() => {
    // Validate icon exists
    if (!iconName || !(iconName in dynamicIconImports)) {
      return null;
    }
    
    try {
      return lazy(dynamicIconImports[iconName as keyof typeof dynamicIconImports]);
    } catch (error) {
      console.error(`Failed to load icon: ${iconName}`, error);
      return null;
    }
  }, [iconName]);
  
  if (!LucideIcon) {
    return fallback;
  }
  
  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
});
