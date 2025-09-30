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
    <Card className="p-6 shadow-xl border-2 border-primary/20">
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === 'search' ? 'default' : 'outline'}
          onClick={() => setMode('search')}
          className="flex-1 h-12"
        >
          <Search className="h-5 w-5 mr-2" />
          Code produit
        </Button>
        <Button
          variant={mode === 'calc' ? 'default' : 'outline'}
          onClick={() => setMode('calc')}
          className="flex-1 h-12"
        >
          <Calculator className="h-5 w-5 mr-2" />
          Calculatrice
        </Button>
      </div>

      <div className="bg-gradient-to-br from-pos-display to-secondary p-6 rounded-2xl mb-4 shadow-inner">
        <div className="text-sm text-white/80 mb-2 font-semibold">
          {mode === 'search' ? '🔍 Code-barres / Référence' : '🧮 Calculatrice'}
        </div>
        <div className="text-5xl font-black text-white tracking-tight min-h-16 flex items-center">
          {display || '0'}
        </div>
      </div>

      <NumericKeypad
        onNumberClick={handleNumberClick}
        onClear={handleClear}
        onBackspace={handleBackspace}
      />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button
          onClick={handleSearch}
          disabled={!display}
          className="h-14 bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-lg hover:scale-105 transition-all"
        >
          <Search className="h-5 w-5 mr-2" />
          Rechercher
        </Button>
        <Button
          onClick={onCreateProduct}
          className="h-14 bg-gradient-to-br from-category-orange to-category-red text-white font-bold shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau produit
        </Button>
      </div>
    </Card>
  );
}
