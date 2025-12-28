'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { THEME_COLORS } from '@/types/profile';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  labelFa?: string;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  label = 'Theme Color',
  labelFa = 'رنگ قالب',
  className,
  disabled = false,
}: ColorPickerProps) {
  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-foreground mb-3">
        {labelFa || label}
      </label>

      <div className="flex flex-wrap gap-2">
        {THEME_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => !disabled && onChange(color)}
            disabled={disabled}
            className={cn(
              'w-8 h-8 rounded-full transition-all flex items-center justify-center',
              'ring-offset-2 ring-offset-background',
              value === color ? 'ring-2 ring-primary scale-110' : 'hover:scale-105',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ backgroundColor: color }}
            title={color}
          >
            {value === color && (
              <Check className="w-4 h-4 text-white drop-shadow-md" />
            )}
          </button>
        ))}

        {/* Custom color input */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => !disabled && onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'w-8 h-8 rounded-full cursor-pointer border-2 border-dashed border-border',
              'appearance-none bg-transparent',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title="رنگ سفارشی"
            style={{
              WebkitAppearance: 'none',
            }}
          />
          {!THEME_COLORS.includes(value as typeof THEME_COLORS[number]) && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-primary flex items-center justify-center"
              style={{ backgroundColor: value }}
            >
              <Check className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">پیش‌نمایش:</span>
        <div
          className="h-6 flex-1 rounded-md transition-colors"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs font-mono text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}
