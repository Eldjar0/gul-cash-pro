import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';

interface NumericKeypadProps {
  onNumberClick: (num: string) => void;
  onClear: () => void;
  onBackspace: () => void;
}

export function NumericKeypad({ onNumberClick, onClear, onBackspace }: NumericKeypadProps) {
  const numbers = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '00'];

  return (
    <div className="grid grid-cols-3 gap-2">
      {numbers.map((num) => (
        <Button
          key={num}
          variant="outline"
          size="lg"
          onClick={() => onNumberClick(num)}
          className="h-14 text-lg font-bold bg-category-blue text-white hover:bg-category-blue/90 border-0 shadow-md hover:shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
        >
          {num}
        </Button>
      ))}
      <Button
        variant="outline"
        size="lg"
        onClick={onBackspace}
        className="h-14 text-base bg-category-orange text-white hover:bg-category-orange/90 border-0 shadow-md hover:shadow-lg transition-all duration-150 hover:scale-105 active:scale-95"
      >
        <Delete className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onClear}
        className="h-14 text-sm font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0 shadow-md hover:shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 col-span-2"
      >
        C
      </Button>
    </div>
  );
}
