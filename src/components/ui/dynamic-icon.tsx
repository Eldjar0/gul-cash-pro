import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { lazy, Suspense } from 'react';

const fallback = <div className="w-6 h-6" />;

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  // Convert the name to kebab-case if needed
  const iconName = name.toLowerCase().replace(/\s+/g, '-');
  
  if (!iconName || !(iconName in dynamicIconImports)) {
    // Return a default icon component for invalid names
    const DefaultIcon = lazy(dynamicIconImports['package']);
    return (
      <Suspense fallback={fallback}>
        <DefaultIcon {...props} />
      </Suspense>
    );
  }
  
  const LucideIcon = lazy(dynamicIconImports[iconName as keyof typeof dynamicIconImports]);
  
  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
}
