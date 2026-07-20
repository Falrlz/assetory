import { useState } from 'react';
import { AreaChart, BarChart2, Layers, TrendingDown, TrendingUp } from 'lucide-react';

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
        return (
            <div className="flex h-64 items-center justify-center text-xs text-neutral-400">
                Belum ada data tren keuangan.
            </div>
        );
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
            <div className="flex flex-col justify-between gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center dark:border-neutral-800">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                            Tren Pendapatan vs Beban
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            Margin {profitMargin}%
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Visualisasi perbandingan pendapatan dan pengeluaran 6 bulan terakhir
                    </p>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
                    <button
                        onClick={() => setChartType('area')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            chartType === 'area'
                                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                    >
                        <AreaChart className="size-3.5" />
                        <span>Kurva</span>
                    </button>
                    <button
                        onClick={() => setChartType('bar')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            chartType === 'bar'
                                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                    >
                        <BarChart2 className="size-3.5" />
                        <span>Batang</span>
                    </button>
                    <button
                        onClick={() => setChartType('profit')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            chartType === 'profit'
                                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                    >
                        <Layers className="size-3.5" />
                        <span>Laba Bersih</span>
                    </button>
                </div>
            </div>

            {/* Interactive Inspection Card */}
            {activeItem && (
                <div className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3.5 sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-neutral-400">Periode Terpilih</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {activeItem.month}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Pendapatan (Masuk)
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(activeItem.income)}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400">
                            Beban (Keluar)
                        </span>
                        <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                            {formatRupiah(activeItem.expense)}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                            Hasil Laba/Rugi
                        </span>
                        <span
                            className={`text-sm font-bold font-mono flex items-center gap-1 ${
                                activeItem.profit >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                            {activeItem.profit >= 0 ? (
                                <TrendingUp className="size-3.5" />
                            ) : (
                                <TrendingDown className="size-3.5" />
                            )}
                            {formatRupiah(activeItem.profit)}
                        </span>
                    </div>
                </div>
            )}

            {/* SVG Interactive Chart Area */}
            <div className="relative w-full overflow-hidden">
                {chartType === 'bar' ? (
                    /* Grouped 3D-styled Bar Chart View */
                    <div className="flex h-56 items-end justify-between gap-4 pt-6 px-2">
                        {data.map((item, idx) => {
                            const incH = Math.max(6, (item.income / maxVal) * 180);
                            const expH = Math.max(6, (item.expense / maxVal) * 180);
                            const isHovered = hoveredIdx === idx;

                            return (
                                <div
                                    key={idx}
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    className={`flex flex-1 flex-col items-center gap-2 group cursor-pointer transition-all ${
                                        isHovered ? 'scale-105' : 'opacity-85 hover:opacity-100'
                                    }`}
                                >
                                    <div className="flex h-full w-full items-end justify-center gap-2 rounded-t-xl bg-neutral-50/70 p-1.5 dark:bg-neutral-800/30">
                                        {/* Income Bar */}
                                        <div
                                            style={{ height: `${incH}px` }}
                                            className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all shadow-xs group-hover:shadow-emerald-500/20"
                                        />
                                        {/* Expense Bar */}
                                        <div
                                            style={{ height: `${expH}px` }}
                                            className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400 transition-all shadow-xs group-hover:shadow-rose-500/20"
                                        />
                                    </div>
                                    <span
                                        className={`text-xs font-semibold ${
                                            isHovered
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-neutral-500 dark:text-neutral-400'
                                        }`}
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
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
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
                                    className="text-neutral-100 dark:text-neutral-800"
                                    strokeDasharray="4 4"
                                />
                            ))}

                            {chartType === 'area' ? (
                                <>
                                    {/* Expense Area & Path */}
                                    <path d={expenseArea} fill="url(#expenseGradient)" />
                                    <path
                                        d={expenseCurve}
                                        fill="none"
                                        stroke="#f43f5e"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />

                                    {/* Income Area & Path */}
                                    <path d={incomeArea} fill="url(#incomeGradient)" />
                                    <path
                                        d={incomeCurve}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </>
                            ) : (
                                <>
                                    {/* Profit Area & Path */}
                                    <path d={profitArea} fill="url(#profitGradient)" />
                                    <path
                                        d={profitCurve}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
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
                                        <rect
                                            x={paddingX + idx * stepX - stepX / 2}
                                            y={paddingY}
                                            width={stepX}
                                            height={chartH}
                                            fill="transparent"
                                        />

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
                                            className={`text-[11px] font-semibold ${
                                                isHovered
                                                    ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                                                    : 'fill-neutral-400 dark:fill-neutral-500'
                                            }`}
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
