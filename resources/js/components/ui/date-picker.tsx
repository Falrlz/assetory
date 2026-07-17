import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (val: string) => void; // YYYY-MM-DD
    id?: string;
    className?: string;
    minYear?: number;
    maxYear?: number;
}

export function DatePicker({
    value,
    onChange,
    id,
    className,
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
        daysGrid.push(<div key={`empty-${i}`} className="h-8 w-8" />);
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
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-mono transition-colors ${
                    isSelected
                        ? 'bg-primary text-primary-foreground font-bold font-sans'
                        : isToday
                          ? 'border border-primary text-primary font-semibold'
                          : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
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
        <div className="relative inline-block" ref={popoverRef}>
            <Button
                id={id}
                type="button"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className={`border-input bg-background text-foreground hover:bg-muted/50 flex h-9 w-40 justify-start px-3 py-2 text-left text-sm font-normal ${className}`}
            >
                <CalendarIcon className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />
                <span className="font-mono text-xs">{formatLabel(value)}</span>
            </Button>

            {isOpen && (
                <div className="absolute left-0 z-50 mt-1 w-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-4 shadow-md outline-hidden ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1">
                            <select
                                value={viewMonth}
                                onChange={(e) => setViewMonth(Number(e.target.value))}
                                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer rounded-md border-0 bg-white dark:bg-zinc-900 p-0 px-1 py-0.5 pr-6 text-xs font-semibold focus:ring-0"
                            >
                                {monthNames.map((name, idx) => (
                                    <option key={name} value={idx} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                                        {name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={viewYear}
                                onChange={(e) => setViewYear(Number(e.target.value))}
                                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer rounded-md border-0 bg-white dark:bg-zinc-900 p-0 px-1 py-0.5 pr-6 text-xs font-semibold focus:ring-0"
                            >
                                {yearsOptions.map((y) => (
                                    <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
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
