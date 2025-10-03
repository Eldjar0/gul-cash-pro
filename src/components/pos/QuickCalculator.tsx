import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Search, Plus, Divide, Minus, Percent, X, Scale, Package, Euro } from 'lucide-react';
import { NumericKeypad } from './NumericKeypad';

interface QuickCalculatorProps {
  onProductCode: (code: string) => void;
  onCreateProduct: () => void;
}

type CalcMode = 'math' | 'weight' | 'quantity' | 'price';

export function QuickCalculator({ onProductCode, onCreateProduct }: QuickCalculatorProps) {
  const [display, setDisplay] = useState('');
  const [mode, setMode] = useState<'search' | 'calc'>('search');
  const [calcMode, setCalcMode] = useState<CalcMode>('math');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumberClick = (num: string) => {
    if (mode === 'calc' && waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay((prev) => prev + num);
    }
  };

  const handleClear = () => {
    setDisplay('');
    setCurrentValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    setDisplay((prev) => prev.slice(0, -1));
  };

  const handleOperation = (op: string) => {
    const inputValue = parseFloat(display);
    
    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operation) {
      const newValue = performCalculation(currentValue, inputValue, operation);
      setDisplay(String(newValue));
      setCurrentValue(newValue);
    }
    
    setWaitingForOperand(true);
    setOperation(op);
  };

  const performCalculation = (firstValue: number, secondValue: number, op: string): number => {
    switch (op) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case '%':
        return firstValue * (secondValue / 100);
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    
    if (currentValue !== null && operation) {
      const result = performCalculation(currentValue, inputValue, operation);
      setDisplay(String(result));
      setCurrentValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleSearch = () => {
    if (display) {
      onProductCode(display);
      setDisplay('');
    }
  };

  const getModeLabel = () => {
    if (mode === 'search') return '🔍 Code produit';
    switch (calcMode) {
      case 'math': return '🧮 Calculatrice';
      case 'weight': return '⚖️ Poids (kg)';
      case 'quantity': return '📦 Quantité';
      case 'price': return '💰 Prix (€)';
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

      {mode === 'calc' && (
        <div className="grid grid-cols-4 gap-1 mb-3">
          <Button
            variant={calcMode === 'math' ? 'default' : 'outline'}
            onClick={() => setCalcMode('math')}
            className="h-8 text-xs px-1"
            size="sm"
          >
            <Calculator className="h-3 w-3" />
          </Button>
          <Button
            variant={calcMode === 'weight' ? 'default' : 'outline'}
            onClick={() => setCalcMode('weight')}
            className="h-8 text-xs px-1"
            size="sm"
          >
            <Scale className="h-3 w-3" />
          </Button>
          <Button
            variant={calcMode === 'quantity' ? 'default' : 'outline'}
            onClick={() => setCalcMode('quantity')}
            className="h-8 text-xs px-1"
            size="sm"
          >
            <Package className="h-3 w-3" />
          </Button>
          <Button
            variant={calcMode === 'price' ? 'default' : 'outline'}
            onClick={() => setCalcMode('price')}
            className="h-8 text-xs px-1"
            size="sm"
          >
            <Euro className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="bg-gradient-to-br from-pos-display to-secondary p-4 rounded-xl mb-3 shadow-inner">
        <div className="text-xs text-white/70 mb-1 font-medium">
          {getModeLabel()}
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

      {mode === 'calc' && calcMode === 'math' && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Button
            onClick={() => handleOperation('+')}
            className="h-12 bg-primary/20 hover:bg-primary/30 font-bold text-lg"
          >
            +
          </Button>
          <Button
            onClick={() => handleOperation('-')}
            className="h-12 bg-primary/20 hover:bg-primary/30 font-bold text-lg"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => handleOperation('*')}
            className="h-12 bg-primary/20 hover:bg-primary/30 font-bold text-lg"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => handleOperation('/')}
            className="h-12 bg-primary/20 hover:bg-primary/30 font-bold text-lg"
          >
            <Divide className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => handleOperation('%')}
            className="h-12 bg-primary/20 hover:bg-primary/30 font-bold text-lg col-span-2"
          >
            <Percent className="h-5 w-5 mr-1" />
            %
          </Button>
          <Button
            onClick={handleEquals}
            disabled={!display}
            className="h-12 bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-lg hover:scale-105 transition-all text-xl col-span-2"
          >
            =
          </Button>
        </div>
      )}

      {mode === 'calc' && calcMode !== 'math' && (
        <div className="mt-3">
          <Button
            onClick={handleSearch}
            disabled={!display}
            className="h-12 w-full bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-lg hover:scale-105 transition-all"
          >
            <Search className="h-4 w-4 mr-2" />
            Valider {calcMode === 'weight' ? 'le poids' : calcMode === 'quantity' ? 'la quantité' : 'le prix'}
          </Button>
        </div>
      )}

      {mode === 'search' && (
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
      )}
    </Card>
  );
}
