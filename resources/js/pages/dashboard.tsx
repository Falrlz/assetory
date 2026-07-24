import { FinancialTrendChart } from '@/components/financial-trend-chart';
import { PageShell } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
    type LucideIcon,
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

const REPORT_SHORTCUTS: { href: string; title: string; caption: string; icon: LucideIcon; tone: string }[] = [
    {
        href: '/reports/balance-sheet',
        title: 'Laporan Posisi Keuangan',
        caption: 'Neraca (Balance Sheet)',
        icon: FileText,
        tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    },
    {
        href: '/reports/profit-loss',
        title: 'Laba dan Rugi',
        caption: 'Kinerja hasil usaha',
        icon: TrendingUp,
        tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
        href: '/reports/cash-flow',
        title: 'Arus Kas',
        caption: 'Arus masuk & keluar kas',
        icon: Coins,
        tone: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
    },
    {
        href: '/reports/trial-balance',
        title: 'Neraca Saldo',
        caption: 'Trial balance akun',
        icon: BookOpen,
        tone: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    },
];

const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val || 0);

interface MetricCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    tone: string;
    valueClassName?: string;
    footer: React.ReactNode;
}

/** One KPI tile. Shared so all four keep identical padding, type scale, and icon size. */
function MetricCard({ label, value, icon: Icon, tone, valueClassName, footer }: MetricCardProps) {
    return (
        <div className="bg-card rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground text-xs font-medium">{label}</span>
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tone)}>
                    <Icon className="size-5" aria-hidden="true" />
                </span>
            </div>
            <p className={cn('text-foreground mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums', valueClassName)}>{value}</p>
            <div className="text-muted-foreground mt-1.5 text-xs">{footer}</div>
        </div>
    );
}

/** Panel wrapper used by every dashboard block below the KPI row. */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn('bg-card rounded-xl border p-5 shadow-xs', className)}>{children}</div>;
}

function PanelHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div className="min-w-0 space-y-1">
                <h2 className="text-foreground text-base font-semibold">{title}</h2>
                <p className="text-muted-foreground text-sm">{description}</p>
            </div>
            {action}
        </div>
    );
}

export default function Dashboard({ metrics, monthly_trend = [], recent_journals = [], asset_breakdown = [] }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const isProfit = metrics.monthly_net_profit >= 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Assetory" />

            <PageShell>
                {/* Banner / Greeting */}
                <div className="relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-gradient-to-r from-neutral-900 via-neutral-800 to-stone-900 p-6 text-white shadow-lg dark:from-neutral-950 dark:via-stone-900 dark:to-neutral-900">
                    <div className="absolute -top-10 -right-10 size-60 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
                    <div className="absolute right-20 -bottom-10 size-48 rounded-full bg-emerald-500/10 blur-2xl" aria-hidden="true" />

                    <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                </span>
                                Ringkasan keuangan real-time
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                                Selamat datang kembali, {auth.user?.name || 'Pengguna'}!
                            </h1>
                            <p className="max-w-xl text-sm leading-relaxed text-neutral-300">
                                Ringkasan portofolio aset, saldo kas &amp; bank, serta kinerja keuangan usaha Anda saat ini.
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button asChild size="sm" className="bg-white text-neutral-900 hover:bg-neutral-100">
                                <Link href="/assets">
                                    <Plus className="text-emerald-600" />
                                    Tambah Aset
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700">
                                <Link href="/journals">
                                    <Notebook className="text-blue-400" />
                                    Jurnal Baru
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700">
                                <Link href="/reports/balance-sheet">
                                    <BarChart3 className="text-amber-400" />
                                    Laporan
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Total Nilai Buku Aset"
                        value={formatRupiah(metrics.total_asset_value)}
                        icon={Building2}
                        tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                        footer={
                            <span className="flex flex-wrap items-center justify-between gap-x-3">
                                <span>{metrics.total_asset_count} aset terdaftar</span>
                                <span>Perolehan {formatRupiah(metrics.total_asset_cost)}</span>
                            </span>
                        }
                    />
                    <MetricCard
                        label="Kas & Setara Kas"
                        value={formatRupiah(metrics.total_cash_and_bank)}
                        icon={Landmark}
                        tone="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                        footer={
                            <span className="flex items-center gap-1.5">
                                <Wallet className="size-3.5 text-blue-500" aria-hidden="true" />
                                Saldo berjalan kas &amp; bank
                            </span>
                        }
                    />
                    <MetricCard
                        label="Laba / Rugi Bulan Ini"
                        value={formatRupiah(metrics.monthly_net_profit)}
                        icon={isProfit ? TrendingUp : TrendingDown}
                        tone={
                            isProfit
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        }
                        valueClassName={isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
                        footer={
                            <span className="flex flex-wrap items-center justify-between gap-x-3">
                                <span className="text-emerald-600 dark:text-emerald-400">+ {formatRupiah(metrics.monthly_income)}</span>
                                <span className="text-rose-600 dark:text-rose-400">− {formatRupiah(metrics.monthly_expense)}</span>
                            </span>
                        }
                    />
                    <MetricCard
                        label="Akumulasi Penyusutan"
                        value={formatRupiah(metrics.total_accumulated_depreciation)}
                        icon={Calculator}
                        tone="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                        footer={
                            <span className="flex items-center gap-1.5">
                                <Scale className="size-3.5 text-amber-500" aria-hidden="true" />
                                Total depresiasi terakumulasi
                            </span>
                        }
                    />
                </div>

                {/* Trend chart + asset breakdown */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Panel className="lg:col-span-2">
                        <FinancialTrendChart data={monthly_trend} />
                    </Panel>

                    <Panel className="flex flex-col justify-between">
                        <div>
                            <PanelHeading
                                title="Portofolio Aset"
                                description="Pembagian kategori aset"
                                action={
                                    <Link
                                        href="/assets"
                                        className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                    >
                                        Semua Aset
                                        <ChevronRight className="size-4" aria-hidden="true" />
                                    </Link>
                                }
                            />

                            <div className="mt-4 space-y-4">
                                {asset_breakdown.length > 0 ? (
                                    asset_breakdown.map((group) => {
                                        const totalCost = metrics.total_asset_cost || 1;
                                        const sharePct = Math.round((group.total_value / totalCost) * 100);

                                        return (
                                            <div key={group.name} className="space-y-2">
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="text-foreground truncate font-medium">
                                                        {group.name} ({group.count})
                                                    </span>
                                                    <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                                                        {formatRupiah(group.net_book_value)}
                                                    </span>
                                                </div>
                                                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                    <div
                                                        style={{ width: `${Math.max(5, sharePct)}%` }}
                                                        className="h-full rounded-full bg-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-muted-foreground py-8 text-center text-sm">Belum ada data aset yang terdaftar.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-muted/50 mt-6 flex items-center justify-between gap-3 rounded-lg p-3 text-sm">
                            <span className="text-muted-foreground">Nilai buku bersih</span>
                            <span className="text-foreground font-mono font-bold tabular-nums">{formatRupiah(metrics.total_asset_value)}</span>
                        </div>
                    </Panel>
                </div>

                {/* Recent journals + report shortcuts */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Panel className="lg:col-span-2">
                        <PanelHeading
                            title="5 Jurnal Transaksi Terakhir"
                            description="Pencatatan mutasi transaksi keuangan terbaru"
                            action={
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/journals">
                                        Lihat Semua
                                        <ArrowUpRight />
                                    </Link>
                                </Button>
                            }
                        />

                        <Table className="mt-2" minWidth="min-w-[560px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead align="center" className="w-28">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="w-40">No. Jurnal</TableHead>
                                    <TableHead>Transaksi</TableHead>
                                    <TableHead align="right" className="w-40">
                                        Total Debit
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recent_journals.length > 0 ? (
                                    recent_journals.map((journal) => (
                                        <TableRow key={journal.id}>
                                            <TableCell align="center" className="text-muted-foreground font-mono text-xs tabular-nums">
                                                {journal.tanggal || '-'}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                {journal.nomor_jurnal}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-xs truncate">
                                                {journal.keterangan || 'Tanpa keterangan'}
                                            </TableCell>
                                            <TableCell numeric className="text-foreground font-semibold">
                                                {formatRupiah(journal.total_debit)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableEmpty colSpan={4} description="Belum ada transaksi jurnal yang tercatat." />
                                )}
                            </TableBody>
                        </Table>
                    </Panel>

                    <Panel>
                        <PanelHeading title="Pintasan Laporan Utama" description="Akses cepat ke dokumen laporan resmi" />

                        <ul className="mt-4 space-y-2.5">
                            {REPORT_SHORTCUTS.map((report) => (
                                <li key={report.href}>
                                    <Link
                                        href={report.href}
                                        className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
                                    >
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', report.tone)}>
                                                <report.icon className="size-4" aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="text-foreground block truncate text-sm font-semibold">{report.title}</span>
                                                <span className="text-muted-foreground block truncate text-xs">{report.caption}</span>
                                            </span>
                                        </span>
                                        <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>
            </PageShell>
        </AppLayout>
    );
}
