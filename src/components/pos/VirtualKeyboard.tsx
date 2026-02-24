import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Delete, ArrowUp, Space } from 'lucide-react';

interface VirtualKeyboardProps {
  type: 'azerty' | 'numeric';
  onInput: (value: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  onSubmit?: () => void;
  compact?: boolean;
  className?: string;
}

const AZERTY_ROWS_LOWER = [
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['CAPS', 'w', 'x', 'c', 'v', 'b', 'n', 'BACKSPACE'],
  ['SPACE'],
];

const AZERTY_ROWS_UPPER = [
  ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
  ['CAPS', 'W', 'X', 'C', 'V', 'B', 'N', 'BACKSPACE'],
  ['SPACE'],
];

const NUMERIC_KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  [',', '0', 'BACKSPACE'],
];

export function VirtualKeyboard({ type, onInput, onBackspace, compact = false, className }: VirtualKeyboardProps) {
  const [caps, setCaps] = useState(true);

  const keyH = compact ? 'h-10' : 'h-12';
  const numKeyH = compact ? 'h-11' : 'h-14';
  const fontSize = compact ? 'text-sm' : 'text-base';
  const numFontSize = compact ? 'text-lg' : 'text-xl';
  const gap = compact ? 'gap-1' : 'gap-1.5';

  if (type === 'numeric') {
    return (
      <div className={cn(`grid grid-cols-3 ${gap}`, className)}>
        {NUMERIC_KEYS.flat().map((key, i) => {
          if (key === 'BACKSPACE') {
            return (
              <button
                key={i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={onBackspace}
                className={cn(numKeyH, "rounded-xl bg-destructive/10 text-destructive font-bold flex items-center justify-center active:scale-95 transition-transform border border-destructive/20")}
              >
                <Delete className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </button>
            );
          }
          return (
            <button
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInput(key)}
              className={cn(numKeyH, numFontSize, "rounded-xl bg-muted hover:bg-muted/80 font-bold flex items-center justify-center active:scale-95 transition-transform border border-border")}
            >
              {key}
            </button>
          );
        })}
      </div>
    );
  }

  // AZERTY keyboard
  const rows = caps ? AZERTY_ROWS_UPPER : AZERTY_ROWS_LOWER;

  return (
    <div className={cn(`space-y-${compact ? '1' : '1.5'}`, className)}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={`flex ${gap} justify-center`}>
          {row.map((key, keyIndex) => {
            if (key === 'SPACE') {
              return (
                <button
                  key={keyIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onInput(' ')}
                  className={cn(keyH, "flex-1 rounded-xl bg-muted hover:bg-muted/80 font-medium text-xs flex items-center justify-center active:scale-95 transition-transform border border-border gap-1.5")}
                >
                  <Space className={compact ? "h-3 w-3" : "h-4 w-4"} />
                  Espace
                </button>
              );
            }
            if (key === 'BACKSPACE') {
              return (
                <button
                  key={keyIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onBackspace}
                  className={cn(keyH, compact ? "w-11" : "w-14", "rounded-xl bg-destructive/10 text-destructive font-bold flex items-center justify-center active:scale-95 transition-transform border border-destructive/20")}
                >
                  <Delete className={compact ? "h-4 w-4" : "h-5 w-5"} />
                </button>
              );
            }
            if (key === 'CAPS') {
              return (
                <button
                  key={keyIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCaps(!caps)}
                  className={cn(
                    keyH, compact ? "w-11" : "w-14",
                    "rounded-xl font-bold flex items-center justify-center active:scale-95 transition-transform border",
                    caps
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  <ArrowUp className={compact ? "h-4 w-4" : "h-5 w-5"} />
                </button>
              );
            }
            return (
              <button
                key={keyIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onInput(key);
                  if (caps) setCaps(false);
                }}
                className={cn(keyH, fontSize, "flex-1 min-w-[28px] max-w-[44px] rounded-xl bg-card hover:bg-muted/60 font-semibold flex items-center justify-center active:scale-95 transition-transform border border-border shadow-sm")}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
