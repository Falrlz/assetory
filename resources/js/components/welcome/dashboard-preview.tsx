import { Building2, Calculator, Landmark, TrendingUp } from 'lucide-react';

const metrics = [
    {
        label: 'Nilai Buku Aset',
        value: 'Rp 842,5 jt',
        icon: Building2,
        tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    { label: 'Kas & Bank', value: 'Rp 156,2 jt', icon: Landmark, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' },
    {
        label: 'Laba Bulan Ini',
        value: 'Rp 48,9 jt',
        icon: TrendingUp,
        tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    { label: 'Akm. Penyusutan', value: 'Rp 97,3 jt', icon: Calculator, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' },
];

const journals = [
    { code: 'JV-202607-0184', label: 'Penyusutan aset Juli', amount: 'Rp 8,1 jt' },
    { code: 'JV-202607-0183', label: 'Pembelian kendaraan operasional', amount: 'Rp 245,0 jt' },
];

/**
 * Static, non-interactive rendition of the product dashboard used as the hero
 * illustration. Built from markup instead of a bitmap so it stays sharp at any
 * viewport and adds no image payload.
 */
export function DashboardPreview() {
    return (
        <div
            aria-hidden="true"
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl select-none dark:border-neutral-800 dark:bg-neutral-900"
        >
            <div className="flex items-center gap-1.5 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/60">
                <span className="size-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="size-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="size-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                <span className="ml-3 truncate text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Dashboard Keuangan</span>
            </div>

            <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] leading-tight font-medium text-neutral-500 sm:text-[11px] dark:text-neutral-400">
                                    {metric.label}
                                </span>
                                <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${metric.tone}`}>
                                    <metric.icon className="size-3.5" />
                                </span>
                            </div>
                            <p className="mt-2 text-sm font-bold tracking-tight text-neutral-900 sm:text-base dark:text-white">{metric.value}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">Tren Pendapatan & Beban</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            +18,4%
                        </span>
                    </div>
                    <svg viewBox="0 0 320 96" preserveAspectRatio="none" className="mt-2.5 h-16 w-full sm:h-24 lg:h-16 xl:h-20" role="presentation" focusable="false">
                        <defs>
                            <linearGradient id="assetory-preview-area" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <g className="text-emerald-500">
                            <path
                                d="M0 72 C 26 72, 26 54, 53 54 C 80 54, 80 62, 107 62 C 134 62, 134 38, 160 38 C 187 38, 187 44, 213 44 C 240 44, 240 22, 267 22 C 293 22, 293 14, 320 14 L 320 96 L 0 96 Z"
                                fill="url(#assetory-preview-area)"
                            />
                            <path
                                d="M0 72 C 26 72, 26 54, 53 54 C 80 54, 80 62, 107 62 C 134 62, 134 38, 160 38 C 187 38, 187 44, 213 44 C 240 44, 240 22, 267 22 C 293 22, 293 14, 320 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                        <path
                            d="M0 86 C 26 86, 26 78, 53 78 C 80 78, 80 82, 107 82 C 134 82, 134 68, 160 68 C 187 68, 187 74, 213 74 C 240 74, 240 60, 267 60 C 293 60, 293 56, 320 56"
                            fill="none"
                            className="text-neutral-300 dark:text-neutral-700"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                </div>

                <ul className="space-y-1.5">
                    {journals.map((journal) => (
                        <li
                            key={journal.code}
                            className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-1.5 dark:bg-neutral-800/50"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    {journal.code}
                                </span>
                                <span className="block truncate text-[10px] text-neutral-500 dark:text-neutral-400">{journal.label}</span>
                            </span>
                            <span className="shrink-0 text-[11px] font-semibold text-neutral-900 dark:text-white">{journal.amount}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
