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
          onClick={() => onNumberClick(num)}
          className="aspect-square text-3xl font-light text-white border-0 transition-all duration-150 hover:brightness-110 active:brightness-90 rounded-full"
          style={{ backgroundColor: '#505050' }}
        >
          {num}
        </Button>
      ))}
      <Button
        onClick={onBackspace}
        className="aspect-square text-white border-0 transition-all duration-150 hover:brightness-110 active:brightness-90 rounded-full"
        style={{ backgroundColor: '#D4D4D2' }}
      >
        <Delete className="h-6 w-6 text-black" />
      </Button>
      <Button
        onClick={onClear}
        className="aspect-square text-xl font-light border-0 transition-all duration-150 hover:brightness-110 active:brightness-90 rounded-full col-span-2"
        style={{ backgroundColor: '#D4D4D2', color: '#000000' }}
      >
        C
      </Button>
    </div>
  );
}
