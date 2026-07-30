import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Lock, RotateCcw, Search } from 'lucide-react';
import React from 'react';

interface FilterBarProps {
    search?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    dateRange?: boolean;
    startDate?: string;
    endDate?: string;
    onStartDateChange?: (value: string) => void;
    onEndDateChange?: (value: string) => void;
    lockDate?: boolean;
    lockDateReason?: string;
    children?: React.ReactNode;
    onReset?: () => void;
    isFiltered?: boolean;
}

export default function FilterBar({
    search = true,
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Cari data...',
    dateRange = false,
    startDate = '',
    endDate = '',
    onStartDateChange,
    onEndDateChange,
    lockDate = false,
    lockDateReason = 'Tanggal dikunci',
    children,
    onReset,
    isFiltered = false,
}: FilterBarProps) {
    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-1 flex-wrap items-center gap-3">
                {/* Search Bar Input */}
                {search && (
                    <div className="relative max-w-xs min-w-[220px] flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            type="text"
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-9 pl-9 text-sm"
                        />
                    </div>
                )}

                {/* Date Range Picker */}
                {dateRange && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => onStartDateChange?.(e.target.value)}
                                disabled={lockDate}
                                title={lockDate ? lockDateReason : undefined}
                                className="h-9 w-[135px] text-xs"
                            />
                        </div>
                        <span className="text-xs text-zinc-400">s/d</span>
                        <div className="relative">
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => onEndDateChange?.(e.target.value)}
                                disabled={lockDate}
                                title={lockDate ? lockDateReason : undefined}
                                className="h-9 w-[135px] text-xs"
                            />
                        </div>
                        {lockDate && (
                            <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-600 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-500">
                                <Lock className="h-3 w-3" />
                                {lockDateReason}
                            </span>
                        )}
                    </div>
                )}

                {/* Custom Slot (Children) */}
                {children}
            </div>

            {/* Reset Button */}
            {isFiltered && onReset && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-9 px-3 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset Filter
                </Button>
            )}
        </div>
    );
}
