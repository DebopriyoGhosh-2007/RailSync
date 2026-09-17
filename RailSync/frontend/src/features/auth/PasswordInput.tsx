import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordProps extends InputProps {
  showStrength?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordProps>(
  ({ className, showStrength, label, error, helperText, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const [strength, setStrength] = useState(0);
    
    const calculateStrength = (val: string) => {
      let score = 0;
      if (val.length > 7) score += 1;
      if (/[A-Z]/.test(val)) score += 1;
      if (/[0-9]/.test(val)) score += 1;
      if (/[^A-Za-z0-9]/.test(val)) score += 1;
      setStrength(score);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showStrength) calculateStrength(e.target.value);
      if (props.onChange) props.onChange(e);
    };

    const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];
    const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-1 text-slate-700">{label} {props.required && <span className="text-destructive">*</span>}</label>}
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            {...props}
            onChange={handleInput}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => setShow(!show)}
            tabIndex={-1}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        {showStrength && props.value && typeof props.value === 'string' && props.value.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1 h-1 mb-1">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className={`flex-1 rounded-full transition-colors ${strength >= idx ? strengthColors[strength] : 'bg-slate-100'}`} />
              ))}
            </div>
            <div className={`text-xs ${strengthColors[strength].replace('bg-', 'text-')}`}>
              {strengthLabels[strength]}
            </div>
          </div>
        )}
        
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';
