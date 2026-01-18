import { useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isBefore,
    isAfter,
    isWithinInterval,
    startOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface RangeCalendarUIProps {
    currentMonth: Date;
    onMonthChange: (date: Date) => void;
    startDate: Date | null;
    endDate: Date | null;
    onDateSelect: (date: Date) => void;
    minValue?: Date;
    maxValue?: Date;
}

export function RangeCalendarUI({
    currentMonth,
    onMonthChange,
    startDate,
    endDate,
    onDateSelect,
    minValue,
    maxValue
}: RangeCalendarUIProps) {
    const today = startOfDay(new Date());

    // Generate two months: currentMonth and nextMonth
    const month1 = currentMonth;
    const month2 = addMonths(currentMonth, 1);

    const generateDays = (month: Date) => {
        const start = startOfWeek(startOfMonth(month));
        const end = endOfWeek(endOfMonth(month));
        return eachDayOfInterval({ start, end });
    };

    const days1 = useMemo(() => generateDays(month1), [month1]);
    const days2 = useMemo(() => generateDays(month2), [month2]);

    const isDateDisabled = (date: Date) => {
        if (minValue && isBefore(startOfDay(date), startOfDay(minValue))) return true;
        if (maxValue && isAfter(startOfDay(date), startOfDay(maxValue))) return true;
        return false;
    };

    const getDayClass = (date: Date, month: Date) => {
        const isDisabled = isDateDisabled(date);
        const isOutsideMonth = !isSameMonth(date, month);

        if (isOutsideMonth) return "invisible"; // Hide days outside the specific month for cleaner look, or just text-slate-200

        if (isDisabled) return "text-slate-300 cursor-not-allowed decoration-slice";

        const isStart = startDate && isSameDay(date, startDate);
        const isEnd = endDate && isSameDay(date, endDate);
        const inRange = startDate && endDate && isWithinInterval(date, { start: startDate, end: endDate });

        const baseClass = "cursor-pointer transition-all relative z-10 hover:bg-slate-100";

        if (isStart || isEnd) {
            return cn(
                baseClass,
                "bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md",
                isStart && "rounded-l-full",
                isEnd && "rounded-r-full",
                (isStart && isEnd) && "rounded-full"
            );
        }

        if (inRange) {
            return cn(
                baseClass,
                "bg-blue-50 text-blue-700 font-medium hover:bg-blue-100",
                "rounded-none" // Rectangular for range body
            );
        }

        return cn(baseClass, "text-slate-700 rounded-full", isSameDay(date, today) && "bg-slate-100 font-semibold text-blue-600");
    };

    const handlePrev = () => onMonthChange(subMonths(currentMonth, 1));
    const handleNext = () => onMonthChange(addMonths(currentMonth, 1));

    const renderMonth = (month: Date, days: Date[]) => (
        <div className="w-64 space-y-4">
            <div className="flex items-center justify-center font-semibold text-slate-900">
                {format(month, 'MMMM yyyy')}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
                {days.map((day, i) => {
                    // Logic to visually connect the range strip
                    const inRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate }) && !isSameDay(day, endDate) && !isSameDay(day, startDate);
                    const isStart = startDate && isSameDay(day, startDate);
                    const isEnd = endDate && isSameDay(day, endDate);

                    // We need a wrapper to create the continuous background strip
                    // The button sits on TOP of this strip
                    return (
                        <div key={i} className="relative py-0.5">
                            {/* Background Strip for Range */}
                            {(inRange || isStart || isEnd) && !isDateDisabled(day) && (startDate && endDate) && (
                                <div className={cn(
                                    "absolute inset-y-0.5 w-full bg-blue-50/80 z-0",
                                    isStart && "left-1/2 w-1/2 rounded-l-none", // Start day: strip starts from center to right
                                    isEnd && "right-1/2 w-1/2 rounded-r-none", // End day: strip ends at center from left
                                    (isStart && isEnd) && "invisible" // Single day range: no strip
                                )} />
                            )}

                            <button
                                type="button"
                                onClick={() => !isDateDisabled(day) && onDateSelect(day)}
                                disabled={isDateDisabled(day)}
                                className={cn(
                                    "w-8 h-8 flex items-center justify-center text-sm relative z-10", // z-10 to stay above strip
                                    getDayClass(day, month)
                                )}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex items-start gap-8 p-2">
            <div className="relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -left-2 top-0 h-7 w-7 rounded-full text-slate-400 hover:text-slate-700"
                    onClick={handlePrev}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                {renderMonth(month1, days1)}
            </div>
            <div className="relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 top-0 h-7 w-7 rounded-full text-slate-400 hover:text-slate-700"
                    onClick={handleNext}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
                {renderMonth(month2, days2)}
            </div>
        </div>
    );
}
