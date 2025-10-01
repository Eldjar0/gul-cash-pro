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
    <div className="grid grid-cols-3 gap-3">
      {numbers.map((num) => (
        <Button
          key={num}
          variant="outline"
          size="lg"
          onClick={() => onNumberClick(num)}
          className="h-16 text-xl font-bold bg-gradient-to-br from-primary to-primary-glow text-white border-0 shadow-lg hover:shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {num}
        </Button>
      ))}
      <Button
        variant="outline"
        size="lg"
        onClick={onBackspace}
        className="h-16 bg-gradient-to-br from-accent to-accent/80 text-white border-0 shadow-lg hover:shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Delete className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onClear}
        className="h-16 text-lg font-bold bg-gradient-to-br from-destructive to-destructive/80 text-white border-0 shadow-lg hover:shadow-glow hover:scale-105 active:scale-95 transition-all duration-200 col-span-2"
      >
        EFFACER
      </Button>
    </div>
  );
}
