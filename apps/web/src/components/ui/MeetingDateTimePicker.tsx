"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover"
import { CustomCalendar } from "./CustomCalendar"
import { TimeScroller } from "./TimeScroller"
import { cn } from "../../utils/cn"

interface MeetingDateTimePickerProps {
    value?: Date
    onChange: (date: Date) => void
    placeholder?: string
}

export function MeetingDateTimePicker({
    value,
    onChange,
    placeholder = "Pick date & time"
}: MeetingDateTimePickerProps) {
    // Use local state if value might be undefined initially to allow picking, 
    // but usually controlled. If value is undefined, we pass current date to sub-components for display but don't commit it until change.
    // Actually, CustomCalendar needs a date to show the month.
    const displayDate = value || new Date()

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-4 py-3 bg-muted/40 hover:bg-muted transition text-sm text-left font-medium",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                        {value ? format(value, "dd MMM yyyy · hh:mm a") : placeholder}
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[320px] rounded-xl p-4"
                align="start"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()} // Also stop touch move propagation for mobile
            >
                <CustomCalendar value={displayDate} onChange={onChange} />
                <TimeScroller value={displayDate} onChange={onChange} />
            </PopoverContent>
        </Popover>
    )
}
