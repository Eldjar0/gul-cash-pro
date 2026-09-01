import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VirtualNumericKeypadProps {
  onKey: (key: string) => void;
  className?: string;
}

export function VirtualNumericKeypad({ onKey, className }: VirtualNumericKeypadProps) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.'];

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {keys.map((key) => (
        <Button
          key={key}
          type="button"
          variant="outline"
          onClick={() => onKey(key)}
          className="h-14 text-xl font-semibold active:bg-primary/20"
        >
          {key}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onKey('←')}
        className="col-span-3 h-12 text-lg font-semibold active:bg-primary/20"
      >
        ← Effacer
      </Button>
    </div>
  );
}
