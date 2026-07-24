import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { controlBaseClass, controlSizeClass, type ControlSize } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (val: string) => void; // YYYY-MM-DD
    id?: string;
    className?: string;
    /** Matches the `Input`/`NativeSelect` height scale so rows of controls line up. */
    size?: ControlSize;
    minYear?: number;
    maxYear?: number;
}

export function DatePicker({
    value,
    onChange,
    id,
    className,
    size = 'default',
    minYear = new Date().getFullYear() - 10,
    maxYear = new Date().getFullYear() + 5,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Timezone-safe parsing of YYYY-MM-DD string
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentDay = new Date().getDate();

    if (value) {
        const parts = value.split('-');
        if (parts.length === 3) {
            currentYear = parseInt(parts[0], 10);
            currentMonth = parseInt(parts[1], 10) - 1; // 0-indexed
            currentDay = parseInt(parts[2], 10);
        }
    }

    // View state of the calendar (which month/year the user is looking at)
    const [viewYear, setViewYear] = useState(currentYear);
    const [viewMonth, setViewMonth] = useState(currentMonth); // 0-indexed

    // Update view state when prop value changes (timezone-safely)
    useEffect(() => {
        if (value) {
            const parts = value.split('-');
            if (parts.length === 3) {
                setViewYear(parseInt(parts[0], 10));
                setViewMonth(parseInt(parts[1], 10) - 1);
            }
        }
    }, [value]);

    // Close popover when clicking outside (safely ignoring select dropdown options)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (target && (target.tagName === 'OPTION' || target.tagName === 'SELECT')) {
                return;
            }
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format YYYY-MM-DD to DD/MM/YYYY for the button label
    const formatLabel = (dateStr: string) => {
        if (!dateStr) return 'Pilih tanggal';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    // Calendar generation helpers
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const handleSelectDay = (day: number) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const yyyy = viewYear;
        const selectedIso = `${yyyy}-${mm}-${dd}`;
        onChange(selectedIso);
        setIsOpen(false);
    };

    // Render calendar days
    const totalDays = daysInMonth(viewYear, viewMonth);
    const startOffset = firstDayIndex(viewYear, viewMonth);

    const daysGrid = [];
    // Empty cells before start of month
    for (let i = 0; i < startOffset; i++) {
        daysGrid.push(<div key={`empty-${i}`} className="size-8" />);
    }
    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
        const isSelected = value && currentYear === viewYear && currentMonth === viewMonth && currentDay === day;
        const isToday =
            new Date().getFullYear() === viewYear &&
            new Date().getMonth() === viewMonth &&
            new Date().getDate() === day;

        daysGrid.push(
            <button
                key={`day-${day}`}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                    'flex size-8 items-center justify-center rounded-md font-mono text-xs tabular-nums transition-colors',
                    isSelected
                        ? 'bg-primary text-primary-foreground font-sans font-bold'
                        : isToday
                          ? 'border-primary text-primary border font-semibold'
                          : 'text-foreground hover:bg-accent',
                )}
            >
                {day}
            </button>,
        );
    }

    // Generate years option array using minYear and maxYear props
    const yearsOptions = [];
    for (let y = minYear; y <= maxYear; y++) {
        yearsOptions.push(y);
    }

    return (
        <div className="relative w-full min-w-0" ref={popoverRef}>
            <button
                id={id}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    controlBaseClass,
                    controlSizeClass[size],
                    'hover:bg-muted/50 items-center justify-start gap-2 text-left font-normal transition-colors',
                    className,
                )}
            >
                <CalendarIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                <span className="truncate font-mono">{formatLabel(value)}</span>
            </button>

            {isOpen && (
                <div className="bg-popover text-popover-foreground animate-in fade-in-50 zoom-in-95 absolute left-0 z-50 mt-1 w-72 rounded-xl border p-4 shadow-md outline-hidden">
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between border-b pb-3">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1 transition-colors"
                            aria-label="Bulan sebelumnya"
                        >
                            <ChevronLeft className="size-4" />
                        </button>

                        <div className="flex items-center gap-1">
                            <select
                                value={viewMonth}
                                onChange={(e) => setViewMonth(Number(e.target.value))}
                                className="bg-popover text-popover-foreground hover:bg-accent cursor-pointer rounded-md border-0 px-1 py-0.5 pr-6 text-sm font-semibold focus:ring-0"
                                aria-label="Pilih bulan"
                            >
                                {monthNames.map((name, idx) => (
                                    <option key={name} value={idx}>
                                        {name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={viewYear}
                                onChange={(e) => setViewYear(Number(e.target.value))}
                                className="bg-popover text-popover-foreground hover:bg-accent cursor-pointer rounded-md border-0 px-1 py-0.5 pr-6 text-sm font-semibold focus:ring-0"
                                aria-label="Pilih tahun"
                            >
                                {yearsOptions.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1 transition-colors"
                            aria-label="Bulan berikutnya"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                        <div>Min</div>
                        <div>Sen</div>
                        <div>Sel</div>
                        <div>Rab</div>
                        <div>Kam</div>
                        <div>Jum</div>
                        <div>Sab</div>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">{daysGrid}</div>
                </div>
            )}
        </div>
    );
}
