import { FinancialTrendChart } from '@/components/financial-trend-chart';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Building2,
    Calculator,
    ChevronRight,
    Coins,
    FileText,
    Landmark,
    Notebook,
    Plus,
    Scale,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';

interface MetricData {
    total_asset_value: number;
    total_asset_cost: number;
    total_accumulated_depreciation: number;
    total_asset_count: number;
    total_cash_and_bank: number;
    monthly_income: number;
    monthly_expense: number;
    monthly_net_profit: number;
}

interface MonthlyTrendItem {
    month: string;
    income: number;
    expense: number;
    profit: number;
}

interface RecentJournalItem {
    id: number;
    tanggal: string | null;
    nomor_jurnal: string;
    keterangan: string;
    tipe_jurnal: string;
    total_debit: number;
    items_count: number;
}

interface AssetBreakdownItem {
    name: string;
    count: number;
    total_value: number;
    net_book_value: number;
}

interface DashboardProps {
    metrics: MetricData;
    monthly_trend: MonthlyTrendItem[];
    recent_journals: RecentJournalItem[];
    asset_breakdown: AssetBreakdownItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val || 0);
};

export default function Dashboard({
    metrics,
    monthly_trend = [],
    recent_journals = [],
    asset_breakdown = [],
}: DashboardProps) {
    const { auth } = usePage<SharedData>().props;

    // Calculate maximum value for chart scaling
    const maxChartValue = Math.max(
        ...monthly_trend.map((t) => Math.max(t.income, t.expense)),
        100000,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Assetory" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Banner / Greeting Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-stone-900 p-6 text-white shadow-xl dark:from-neutral-950 dark:via-stone-900 dark:to-neutral-900 border border-neutral-800/80">
                    <div className="absolute -right-10 -top-10 size-60 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute -bottom-10 right-20 size-48 rounded-full bg-emerald-500/10 blur-2xl" />

                    <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                                </span>
                                Assetory Real-Time Financial Overview
                            </div>
                            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                                Selamat Datang Kembali, {auth.user?.name || 'Pengguna'}!
                            </h1>
                            <p className="mt-1 max-w-xl text-sm text-neutral-300">
                                Ringkasan portofolio aset, saldo kas & bank, serta kinerja keuangan usaha Anda saat ini.
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/assets"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-neutral-900 transition-all hover:bg-neutral-100 hover:shadow-md active:scale-95"
                            >
                                <Plus className="size-4 text-emerald-600" />
                                Tambah Aset
                            </Link>
                            <Link
                                href="/journals"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-white border border-neutral-700 transition-all hover:bg-neutral-700 active:scale-95"
                            >
                                <Notebook className="size-4 text-blue-400" />
                                Jurnal Baru
                            </Link>
                            <Link
                                href="/reports/balance-sheet"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 px-3.5 py-2.5 text-xs font-semibold text-neutral-300 border border-neutral-700 transition-all hover:bg-neutral-700 hover:text-white active:scale-95"
                            >
                                <BarChart3 className="size-4 text-amber-400" />
                                Laporan
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Top 4 Metrics Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Metric 1: Total Nilai Aset */}
                    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                Total Nilai Buku Aset
                            </span>
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <Building2 className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                {formatRupiah(metrics.total_asset_value)}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                <span>{metrics.total_asset_count} Aset Terdaftar</span>
                                <span className="truncate text-[11px] text-neutral-400">
                                    Perolehan: {formatRupiah(metrics.total_asset_cost)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 2: Kas & Setara Kas */}
                    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                Kas & Setara Kas
                            </span>
                            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <Landmark className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                {formatRupiah(metrics.total_cash_and_bank)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                <Wallet className="size-3.5 text-blue-500" />
                                <span>Saldo Berjalan Kas & Bank</span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 3: Laba / Rugi Bulan Ini */}
                    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                Laba / Rugi Bulan Ini
                            </span>
                            <div
                                className={`flex size-9 items-center justify-center rounded-lg ${
                                    metrics.monthly_net_profit >= 0
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                }`}
                            >
                                {metrics.monthly_net_profit >= 0 ? (
                                    <TrendingUp className="size-5" />
                                ) : (
                                    <TrendingDown className="size-5" />
                                )}
                            </div>
                        </div>
                        <div className="mt-3">
                            <div
                                className={`text-2xl font-bold tracking-tight ${
                                    metrics.monthly_net_profit >= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                }`}
                            >
                                {formatRupiah(metrics.monthly_net_profit)}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    + {formatRupiah(metrics.monthly_income)}
                                </span>
                                <span className="text-rose-500 dark:text-rose-400">
                                    - {formatRupiah(metrics.monthly_expense)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 4: Akumulasi Penyusutan */}
                    <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                Akumulasi Penyusutan
                            </span>
                            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                <Calculator className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                {formatRupiah(metrics.total_accumulated_depreciation)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                <Scale className="size-3.5 text-amber-500" />
                                <span>Total Depresiasi Terakumulasi</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Visualisation (Trend Chart + Asset Breakdown) */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Monthly Trend Chart (2 Cols) */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
                        <FinancialTrendChart data={monthly_trend} />
                    </div>

                    {/* Asset Breakdown (1 Col) */}
                    <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div>
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                                <div>
                                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                                        Portofolio Aset
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Pembagian kategori aset perusahaan
                                    </p>
                                </div>
                                <Link
                                    href="/assets"
                                    className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                >
                                    Semua Aset
                                    <ChevronRight className="size-3.5 ml-0.5" />
                                </Link>
                            </div>

                            <div className="mt-4 space-y-4">
                                {asset_breakdown.length > 0 ? (
                                    asset_breakdown.map((group, idx) => {
                                        const totalCost = metrics.total_asset_cost || 1;
                                        const sharePct = Math.round((group.total_value / totalCost) * 100);

                                        return (
                                            <div key={idx} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                        {group.name} ({group.count})
                                                    </span>
                                                    <span className="font-mono text-neutral-600 dark:text-neutral-400">
                                                        {formatRupiah(group.net_book_value)}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                    <div
                                                        style={{ width: `${Math.max(5, sharePct)}%` }}
                                                        className="h-full rounded-full bg-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center text-xs text-neutral-400">
                                        Belum ada data aset yang terdaftar.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 rounded-lg bg-neutral-50 p-3 text-xs dark:bg-neutral-800/50">
                            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                                <span>Nilai Buku Bersih:</span>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                    {formatRupiah(metrics.total_asset_value)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Recent Journals & Quick Reports Shortcuts */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Transactions Table (2 Cols) */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                            <div>
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                                    5 Jurnal Transaksi Terakhir
                                </h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Pencatatan mutasi transaksi keuangan terbaru
                                </p>
                            </div>
                            <Link
                                href="/journals"
                                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                            >
                                Lihat Semua Jurnal
                                <ArrowUpRight className="size-3.5" />
                            </Link>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-neutral-100 text-neutral-400 dark:border-neutral-800">
                                        <th className="py-2.5 font-medium">Tanggal</th>
                                        <th className="py-2.5 font-medium">No. Jurnal</th>
                                        <th className="py-2.5 font-medium">Keterangan</th>
                                        <th className="py-2.5 font-medium text-right">Total Debit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {recent_journals.length > 0 ? (
                                        recent_journals.map((j) => (
                                            <tr key={j.id} className="group hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                                                <td className="py-3 font-mono text-neutral-500 dark:text-neutral-400">
                                                    {j.tanggal || '-'}
                                                </td>
                                                <td className="py-3 font-medium text-emerald-600 dark:text-emerald-400">
                                                    {j.nomor_jurnal}
                                                </td>
                                                <td className="py-3 text-neutral-700 dark:text-neutral-300 max-w-xs truncate">
                                                    {j.keterangan || 'Tanpa Keterangan'}
                                                </td>
                                                <td className="py-3 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                                                    {formatRupiah(j.total_debit)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-neutral-400">
                                                Belum ada transaksi jurnal yang tercatat.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Reports Quick Access (1 Col) */}
                    <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div>
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                                Pintasan Laporan Utama
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Akses cepat ke dokumen laporan resmi
                            </p>

                            <div className="mt-4 space-y-2.5">
                                <Link
                                    href="/reports/balance-sheet"
                                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                            <FileText className="size-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                                                Neraca Keuangan
                                            </div>
                                            <div className="text-[11px] text-neutral-500">Laporan Posisi Keuangan</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 text-neutral-400" />
                                </Link>

                                <Link
                                    href="/reports/profit-loss"
                                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                            <TrendingUp className="size-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                                                Laba dan Rugi
                                            </div>
                                            <div className="text-[11px] text-neutral-500">Kinerja Hasil Usaha</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 text-neutral-400" />
                                </Link>

                                <Link
                                    href="/reports/cash-flow"
                                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                                            <Coins className="size-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                                                Arus Kas
                                            </div>
                                            <div className="text-[11px] text-neutral-500">Arus Masuk & Keluar Kas</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 text-neutral-400" />
                                </Link>

                                <Link
                                    href="/reports/trial-balance"
                                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-neutral-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                                            <BookOpen className="size-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                                                Neraca Saldo
                                            </div>
                                            <div className="text-[11px] text-neutral-500">Trial Balance Akun</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 text-neutral-400" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
