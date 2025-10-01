import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Search, Plus } from 'lucide-react';
import { NumericKeypad } from './NumericKeypad';

interface QuickCalculatorProps {
  onProductCode: (code: string) => void;
  onCreateProduct: () => void;
}

export function QuickCalculator({ onProductCode, onCreateProduct }: QuickCalculatorProps) {
  const [display, setDisplay] = useState('');
  const [mode, setMode] = useState<'search' | 'calc'>('search');

  const handleNumberClick = (num: string) => {
    setDisplay((prev) => prev + num);
  };

  const handleClear = () => {
    setDisplay('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => prev.slice(0, -1));
  };

  const handleSearch = () => {
    if (display) {
      onProductCode(display);
      setDisplay('');
    }
  };

  return (
    <Card className="p-4 shadow-xl border-2 border-primary/30">
      <div className="flex gap-2 mb-3">
        <Button
          variant={mode === 'search' ? 'default' : 'outline'}
          onClick={() => setMode('search')}
          className="flex-1 h-10 text-sm"
        >
          <Search className="h-4 w-4 mr-1" />
          Code
        </Button>
        <Button
          variant={mode === 'calc' ? 'default' : 'outline'}
          onClick={() => setMode('calc')}
          className="flex-1 h-10 text-sm"
        >
          <Calculator className="h-4 w-4 mr-1" />
          Calc
        </Button>
      </div>

      <div className="bg-gradient-to-br from-pos-display to-secondary p-4 rounded-xl mb-3 shadow-inner">
        <div className="text-xs text-white/70 mb-1 font-medium">
          {mode === 'search' ? '🔍 Code produit' : '🧮 Calculatrice'}
        </div>
        <div className="text-4xl font-black text-white tracking-tight min-h-12 flex items-center">
          {display || '0'}
        </div>
      </div>

      <NumericKeypad
        onNumberClick={handleNumberClick}
        onClear={handleClear}
        onBackspace={handleBackspace}
      />

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button
          onClick={handleSearch}
          disabled={!display}
          className="h-12 bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-lg hover:scale-105 transition-all text-sm"
        >
          <Search className="h-4 w-4 mr-1" />
          Chercher
        </Button>
        <Button
          onClick={onCreateProduct}
          className="h-12 bg-gradient-to-br from-primary to-primary-glow text-white font-bold shadow-lg hover:scale-105 transition-all text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouveau
        </Button>
      </div>
    </Card>
  );
}
