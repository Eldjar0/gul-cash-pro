import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { lazy, Suspense, memo, useMemo, ComponentType } from 'react';
import { Skeleton } from './skeleton';

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

// Cache for loaded icon components
const iconCache = new Map<string, React.LazyExoticComponent<ComponentType<LucideProps>>>();

const DynamicIconComponent = ({ name, size = 24, ...props }: DynamicIconProps) => {
  const iconName = name.toLowerCase().replace(/\s+/g, '-');
  
  // Stable fallback with exact dimensions
  const fallback = useMemo(
    () => <Skeleton className="rounded" style={{ width: size, height: size, minWidth: size, minHeight: size }} />,
    [size]
  );
  
  // Validate icon exists before lazy loading
  if (!iconName || !(iconName in dynamicIconImports)) {
    return fallback;
  }
  
  // Get or create cached icon component
  const LucideIcon = useMemo(() => {
    if (iconCache.has(iconName)) {
      return iconCache.get(iconName)!;
    }
    
    try {
      const icon = lazy(dynamicIconImports[iconName as keyof typeof dynamicIconImports] as any) as React.LazyExoticComponent<ComponentType<LucideProps>>;
      iconCache.set(iconName, icon);
      return icon;
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
      <LucideIcon size={size} {...props} />
    </Suspense>
  );
};

export const DynamicIcon = memo(DynamicIconComponent);
