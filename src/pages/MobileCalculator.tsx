import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Delete } from 'lucide-react';

export default function MobileCalculator() {
  const navigate = useNavigate();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display);
    
    if (previousValue !== null && operation && !newNumber) {
      handleEquals();
    } else {
      setPreviousValue(currentValue);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const handleEquals = () => {
    if (previousValue === null || operation === null) return;
    
    const currentValue = parseFloat(display);
    let result = 0;
    
    switch (operation) {
      case '+':
        result = previousValue + currentValue;
        break;
      case '-':
        result = previousValue - currentValue;
        break;
      case '×':
        result = previousValue * currentValue;
        break;
      case '÷':
        result = currentValue !== 0 ? previousValue / currentValue : 0;
        break;
      case '%':
        result = previousValue * (currentValue / 100);
        break;
    }
    
    setDisplay(result.toString());
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handlePlusMinus = () => {
    setDisplay((parseFloat(display) * -1).toString());
  };

  const handlePercentage = () => {
    setDisplay((parseFloat(display) / 100).toString());
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const buttonClass = (type: 'number' | 'operator' | 'special' | 'equals') => {
    const base = 'h-20 text-2xl font-normal rounded-full transition-all active:scale-95';
    switch (type) {
      case 'number':
        return `${base} bg-[#505050] hover:bg-[#606060] text-white`;
      case 'operator':
        return `${base} ${operation ? 'bg-white text-[#ff9f0a]' : 'bg-[#ff9f0a] text-white'} hover:bg-white hover:text-[#ff9f0a]`;
      case 'special':
        return `${base} bg-[#a5a5a5] hover:bg-[#b5b5b5] text-black`;
      case 'equals':
        return `${base} bg-[#ff9f0a] hover:bg-[#ffb340] text-white`;
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 pt-2 mb-4">
          <Button
            onClick={() => navigate('/mobile')}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Calculatrice</h1>
        </div>

        {/* Calculator */}
        <Card className="bg-black border-0 shadow-none">
          {/* Display */}
          <div className="px-6 py-8 text-right">
            <div className="text-white text-6xl font-light tabular-nums overflow-x-auto whitespace-nowrap">
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-3 p-4">
            {/* Row 1 */}
            <Button onClick={handleClear} className={buttonClass('special')}>
              AC
            </Button>
            <Button onClick={handlePlusMinus} className={buttonClass('special')}>
              +/-
            </Button>
            <Button onClick={handlePercentage} className={buttonClass('special')}>
              %
            </Button>
            <Button onClick={() => handleOperation('÷')} className={buttonClass('operator')}>
              ÷
            </Button>

            {/* Row 2 */}
            <Button onClick={() => handleNumber('7')} className={buttonClass('number')}>
              7
            </Button>
            <Button onClick={() => handleNumber('8')} className={buttonClass('number')}>
              8
            </Button>
            <Button onClick={() => handleNumber('9')} className={buttonClass('number')}>
              9
            </Button>
            <Button onClick={() => handleOperation('×')} className={buttonClass('operator')}>
              ×
            </Button>

            {/* Row 3 */}
            <Button onClick={() => handleNumber('4')} className={buttonClass('number')}>
              4
            </Button>
            <Button onClick={() => handleNumber('5')} className={buttonClass('number')}>
              5
            </Button>
            <Button onClick={() => handleNumber('6')} className={buttonClass('number')}>
              6
            </Button>
            <Button onClick={() => handleOperation('-')} className={buttonClass('operator')}>
              -
            </Button>

            {/* Row 4 */}
            <Button onClick={() => handleNumber('1')} className={buttonClass('number')}>
              1
            </Button>
            <Button onClick={() => handleNumber('2')} className={buttonClass('number')}>
              2
            </Button>
            <Button onClick={() => handleNumber('3')} className={buttonClass('number')}>
              3
            </Button>
            <Button onClick={() => handleOperation('+')} className={buttonClass('operator')}>
              +
            </Button>

            {/* Row 5 */}
            <Button onClick={() => handleNumber('0')} className={`${buttonClass('number')} col-span-2`}>
              0
            </Button>
            <Button onClick={handleDecimal} className={buttonClass('number')}>
              ,
            </Button>
            <Button onClick={handleEquals} className={buttonClass('equals')}>
              =
            </Button>
          </div>

          {/* Backspace button */}
          <div className="px-4 pb-4">
            <Button
              onClick={handleBackspace}
              className="w-full h-14 bg-[#d4d4d2] hover:bg-[#e4e4e2] text-black rounded-full"
            >
              <Delete className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}