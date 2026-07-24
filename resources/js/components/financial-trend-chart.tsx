import { AreaChart, BarChart2, Layers, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MonthlyTrendItem {
    month: string;
    income: number;
    expense: number;
    profit: number;
}

interface FinancialTrendChartProps {
    data: MonthlyTrendItem[];
}

type ChartType = 'area' | 'bar' | 'profit';

const CHART_TABS: { type: ChartType; label: string; icon: typeof AreaChart }[] = [
    { type: 'area', label: 'Kurva', icon: AreaChart },
    { type: 'bar', label: 'Batang', icon: BarChart2 },
    { type: 'profit', label: 'Laba Bersih', icon: Layers },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val || 0);
};

// Smooth Bezier Curve generator for SVG path
function getCurvedPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const cpX = (current.x + next.x) / 2;

        path += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
}

export function FinancialTrendChart({ data = [] }: FinancialTrendChartProps) {
    const [chartType, setChartType] = useState<ChartType>('area');
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(data.length > 0 ? data.length - 1 : null);

    if (data.length === 0) {
        return <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">Belum ada data tren keuangan.</div>;
    }

    // Totals for header
    const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0);
    const totalProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : '0';

    // SVG Layout Dimensions
    const width = 600;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense, Math.abs(d.profit))), 100000);
    const minVal = 0;

    // Map data to SVG coordinates
    const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

    const incomePoints = data.map((d, i) => ({
        x: paddingX + i * stepX,
        y: height - paddingY - (d.income / maxVal) * chartH,
    }));

    const expensePoints = data.map((d, i) => ({
        x: paddingX + i * stepX,
        y: height - paddingY - (d.expense / maxVal) * chartH,
    }));

    const profitPoints = data.map((d, i) => ({
        x: paddingX + i * stepX,
        y: height - paddingY - (Math.max(0, d.profit) / maxVal) * chartH,
    }));

    const incomeCurve = getCurvedPath(incomePoints);
    const expenseCurve = getCurvedPath(expensePoints);
    const profitCurve = getCurvedPath(profitPoints);

    const incomeArea = `${incomeCurve} L ${paddingX + (data.length - 1) * stepX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;
    const expenseArea = `${expenseCurve} L ${paddingX + (data.length - 1) * stepX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;
    const profitArea = `${profitCurve} L ${paddingX + (data.length - 1) * stepX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

    const activeItem = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

    return (
        <div className="flex flex-col gap-5">
            {/* Header Controls & Summary Stats */}
            <div className="flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-foreground text-base font-semibold">Tren Pendapatan vs Beban</h3>
                        <Badge variant="success">Margin {profitMargin}%</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">Perbandingan pendapatan dan pengeluaran enam bulan terakhir</p>
                </div>

                {/* View Switcher Tabs */}
                <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
                    {CHART_TABS.map((tab) => (
                        <button
                            key={tab.type}
                            type="button"
                            onClick={() => setChartType(tab.type)}
                            className={cn(
                                'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors',
                                chartType === tab.type ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <tab.icon className="size-3.5" aria-hidden="true" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Interactive Inspection Card */}
            {activeItem && (
                <div className="bg-muted/40 grid gap-4 rounded-xl border p-4 sm:grid-cols-4">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-medium">Periode Terpilih</span>
                        <span className="text-foreground text-sm font-bold">{activeItem.month}</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pendapatan (Masuk)</span>
                        <span className="font-mono text-sm font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                            {formatRupiah(activeItem.income)}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Beban (Keluar)</span>
                        <span className="font-mono text-sm font-bold text-rose-600 tabular-nums dark:text-rose-400">
                            {formatRupiah(activeItem.expense)}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs font-medium">Hasil Laba/Rugi</span>
                        <span
                            className={`flex items-center gap-1 font-mono text-sm font-bold tabular-nums ${
                                activeItem.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                            {activeItem.profit >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                            {formatRupiah(activeItem.profit)}
                        </span>
                    </div>
                </div>
            )}

            {/* SVG Interactive Chart Area */}
            <div className="relative w-full overflow-hidden">
                {chartType === 'bar' ? (
                    /* Grouped 3D-styled Bar Chart View */
                    <div className="flex h-56 items-end justify-between gap-4 px-2 pt-6">
                        {data.map((item, idx) => {
                            const incH = Math.max(6, (item.income / maxVal) * 180);
                            const expH = Math.max(6, (item.expense / maxVal) * 180);
                            const isHovered = hoveredIdx === idx;

                            return (
                                <div
                                    key={idx}
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    className={`group flex flex-1 cursor-pointer flex-col items-center gap-2 transition-all ${
                                        isHovered ? 'scale-105' : 'opacity-85 hover:opacity-100'
                                    }`}
                                >
                                    <div className="bg-muted/40 flex h-full w-full items-end justify-center gap-2 rounded-t-xl p-1.5">
                                        {/* Income Bar */}
                                        <div
                                            style={{ height: `${incH}px` }}
                                            className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-xs transition-all group-hover:shadow-emerald-500/20"
                                        />
                                        {/* Expense Bar */}
                                        <div
                                            style={{ height: `${expH}px` }}
                                            className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400 shadow-xs transition-all group-hover:shadow-rose-500/20"
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-semibold',
                                            isHovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                                        )}
                                    >
                                        {item.month}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* SVG Area / Profit Curve View */
                    <div className="relative">
                        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible">
                            <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>

                            {/* Background Grid Lines */}
                            {[0.2, 0.5, 0.8].map((ratio, i) => (
                                <line
                                    key={i}
                                    x1={paddingX}
                                    y1={height - paddingY - ratio * chartH}
                                    x2={width - paddingX}
                                    y2={height - paddingY - ratio * chartH}
                                    stroke="currentColor"
                                    className="text-border"
                                    strokeDasharray="4 4"
                                />
                            ))}

                            {chartType === 'area' ? (
                                <>
                                    {/* Expense Area & Path */}
                                    <path d={expenseArea} fill="url(#expenseGradient)" />
                                    <path d={expenseCurve} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />

                                    {/* Income Area & Path */}
                                    <path d={incomeArea} fill="url(#incomeGradient)" />
                                    <path d={incomeCurve} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                                </>
                            ) : (
                                <>
                                    {/* Profit Area & Path */}
                                    <path d={profitArea} fill="url(#profitGradient)" />
                                    <path d={profitCurve} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                                </>
                            )}

                            {/* Interactive Data Points & Hover Crosshair */}
                            {data.map((item, idx) => {
                                const pt = chartType === 'profit' ? profitPoints[idx] : incomePoints[idx];
                                const ptExp = expensePoints[idx];
                                const isHovered = hoveredIdx === idx;

                                return (
                                    <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)}>
                                        {/* Transparent Hover Hitbox Area */}
                                        <rect x={paddingX + idx * stepX - stepX / 2} y={paddingY} width={stepX} height={chartH} fill="transparent" />

                                        {/* Vertical Guide Line */}
                                        {isHovered && (
                                            <line
                                                x1={pt.x}
                                                y1={paddingY}
                                                x2={pt.x}
                                                y2={height - paddingY}
                                                stroke="#94a3b8"
                                                strokeWidth="1.5"
                                                strokeDasharray="3 3"
                                            />
                                        )}

                                        {/* Income Point Dot */}
                                        {chartType === 'area' && (
                                            <>
                                                <circle
                                                    cx={ptExp.x}
                                                    cy={ptExp.y}
                                                    r={isHovered ? 6 : 4}
                                                    fill="#f43f5e"
                                                    stroke="#ffffff"
                                                    strokeWidth="2"
                                                    className="transition-all"
                                                />
                                                <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r={isHovered ? 7 : 4.5}
                                                    fill="#10b981"
                                                    stroke="#ffffff"
                                                    strokeWidth="2.5"
                                                    className="transition-all"
                                                />
                                            </>
                                        )}

                                        {chartType === 'profit' && (
                                            <circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={isHovered ? 7 : 4.5}
                                                fill="#3b82f6"
                                                stroke="#ffffff"
                                                strokeWidth="2.5"
                                                className="transition-all"
                                            />
                                        )}

                                        {/* Month Label */}
                                        <text
                                            x={paddingX + idx * stepX}
                                            y={height - 8}
                                            textAnchor="middle"
                                            className={cn(
                                                'text-xs font-semibold',
                                                isHovered ? 'fill-emerald-600 font-bold dark:fill-emerald-400' : 'fill-muted-foreground',
                                            )}
                                        >
                                            {item.month}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
