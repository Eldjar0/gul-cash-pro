import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Delete, CornerDownLeft, X } from 'lucide-react';

interface VirtualKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function VirtualKeyboard({ value, onChange, onClose, onSubmit }: VirtualKeyboardProps) {
  const [isUpperCase, setIsUpperCase] = useState(false);

  const letters = [
    ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    ['W', 'X', 'C', 'V', 'B', 'N'],
  ];

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  const handleKeyPress = (key: string) => {
    const char = isUpperCase ? key.toUpperCase() : key.toLowerCase();
    onChange(value + char);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const handleSpace = () => {
    onChange(value + ' ');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-t-2xl shadow-2xl p-3 pb-6 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Affichage de la valeur */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-white dark:bg-slate-700 rounded-lg px-4 py-3 text-lg font-medium border-2 border-primary/30 min-h-[48px]">
            {value || <span className="text-muted-foreground">Rechercher...</span>}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-12 w-12 text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Chiffres */}
        <div className="grid grid-cols-10 gap-1 mb-2">
          {numbers.map((num) => (
            <Button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-11 text-lg font-bold bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-blue-700 shadow-md transition-all active:scale-95"
            >
              {num}
            </Button>
          ))}
        </div>

        {/* Lettres - Ligne 1 */}
        <div className="grid grid-cols-10 gap-1 mb-1">
          {letters[0].map((letter) => (
            <Button
              key={letter}
              onClick={() => handleKeyPress(letter)}
              className="h-11 text-base font-bold bg-gradient-to-b from-white to-gray-100 dark:from-slate-600 dark:to-slate-700 hover:from-gray-100 hover:to-gray-200 text-slate-800 dark:text-white border-2 border-slate-300 dark:border-slate-500 shadow-md transition-all active:scale-95"
            >
              {isUpperCase ? letter : letter.toLowerCase()}
            </Button>
          ))}
        </div>

        {/* Lettres - Ligne 2 */}
        <div className="grid grid-cols-10 gap-1 mb-1">
          {letters[1].map((letter) => (
            <Button
              key={letter}
              onClick={() => handleKeyPress(letter)}
              className="h-11 text-base font-bold bg-gradient-to-b from-white to-gray-100 dark:from-slate-600 dark:to-slate-700 hover:from-gray-100 hover:to-gray-200 text-slate-800 dark:text-white border-2 border-slate-300 dark:border-slate-500 shadow-md transition-all active:scale-95"
            >
              {isUpperCase ? letter : letter.toLowerCase()}
            </Button>
          ))}
        </div>

        {/* Lettres - Ligne 3 + Actions */}
        <div className="flex gap-1 mb-2">
          <Button
            onClick={() => setIsUpperCase(!isUpperCase)}
            className={`h-11 px-4 text-sm font-bold shadow-md transition-all active:scale-95 ${
              isUpperCase 
                ? 'bg-gradient-to-b from-primary to-primary/80 text-white border-2 border-primary' 
                : 'bg-gradient-to-b from-slate-300 to-slate-400 text-slate-700 border-2 border-slate-500'
            }`}
          >
            MAJ
          </Button>
          
          <div className="flex-1 grid grid-cols-6 gap-1">
            {letters[2].map((letter) => (
              <Button
                key={letter}
                onClick={() => handleKeyPress(letter)}
                className="h-11 text-base font-bold bg-gradient-to-b from-white to-gray-100 dark:from-slate-600 dark:to-slate-700 hover:from-gray-100 hover:to-gray-200 text-slate-800 dark:text-white border-2 border-slate-300 dark:border-slate-500 shadow-md transition-all active:scale-95"
              >
                {isUpperCase ? letter : letter.toLowerCase()}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={handleBackspace}
            className="h-11 px-4 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-2 border-orange-700 shadow-md transition-all active:scale-95"
          >
            <Delete className="h-5 w-5" />
          </Button>
        </div>

        {/* Ligne du bas */}
        <div className="flex gap-1">
          <Button
            onClick={handleClear}
            className="h-12 px-6 text-sm font-bold bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-red-700 shadow-md transition-all active:scale-95"
          >
            Effacer
          </Button>
          
          <Button
            onClick={handleSpace}
            className="flex-1 h-12 text-sm font-bold bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-500 dark:to-slate-600 hover:from-slate-300 hover:to-slate-400 text-slate-700 dark:text-white border-2 border-slate-400 shadow-md transition-all active:scale-95"
          >
            Espace
          </Button>
          
          <Button
            onClick={onSubmit}
            className="h-12 px-6 text-sm font-bold bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-2 border-green-700 shadow-md transition-all active:scale-95"
          >
            <CornerDownLeft className="h-5 w-5 mr-2" />
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
