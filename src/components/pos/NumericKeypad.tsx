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
          className="aspect-square text-3xl font-light text-white border-0 transition-all duration-100 hover:brightness-125 active:brightness-90 rounded-full shadow-lg hover:shadow-xl"
          style={{ backgroundColor: '#505050' }}
        >
          {num}
        </Button>
      ))}
      <Button
        onClick={onBackspace}
        className="aspect-square text-white border-0 transition-all duration-100 hover:brightness-110 active:brightness-90 rounded-full shadow-xl hover:shadow-2xl hover:shadow-primary/60 group"
        style={{ background: 'linear-gradient(135deg, hsl(217, 91%, 60%), hsl(262, 83%, 58%))' }}
      >
        <Delete className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-100" />
      </Button>
      <Button
        onClick={onClear}
        className="aspect-square text-xl font-semibold border-0 transition-all duration-100 hover:brightness-110 active:brightness-90 rounded-full col-span-2 shadow-lg hover:shadow-xl"
        style={{ backgroundColor: '#D4D4D2', color: '#000000' }}
      >
        C
      </Button>
    </div>
  );
}
