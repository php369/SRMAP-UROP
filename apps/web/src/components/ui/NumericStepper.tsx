
import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '../../utils/cn';

interface NumericStepperProps {
    value: string;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const NumericStepper = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 0.5,
    className,
    size = 'md'
}: NumericStepperProps) => {
    const numValue = parseFloat(value) || 0;

    const handleDecrement = () => {
        const newValue = Math.max(min, numValue - step);
        onChange(newValue.toString());
    };

    const handleIncrement = () => {
        const newValue = Math.min(max, numValue + step);
        onChange(newValue.toString());
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const isSm = size === 'sm';

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={numValue <= min}
                className={cn(
                    "shrink-0 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                    isSm ? "h-8 w-8" : "h-10 w-10"
                )}
            >
                <Minus className={cn(isSm ? "w-3 h-3" : "w-4 h-4")} />
            </Button>

            <div className="relative flex-1 min-w-[60px]">
                <Input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    step={step}
                    className={cn(
                        "text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-amber-500",
                        isSm ? "h-8 text-sm" : "h-10 text-base"
                    )}
                />
            </div>

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={numValue >= max}
                className={cn(
                    "shrink-0 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                    isSm ? "h-8 w-8" : "h-10 w-10"
                )}
            >
                <Plus className={cn(isSm ? "w-3 h-3" : "w-4 h-4")} />
            </Button>
        </div>
    );
};
