import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Printer, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan Arus Kas',
        href: '/reports/cash-flow',
    },
];

interface CashItem {
    kategori_arus_kas: string;
    keterangan: string;
    tanggal: string;
    nomor_jurnal: string;
    cash_in: number | string;
    cash_out: number | string;
}

interface CashFlowProps {
    operatingItems: CashItem[];
    investingItems: CashItem[];
    financingItems: CashItem[];
    totalOperating: number;
    totalOperatingLastYear: number;
    totalOperatingIn: number;
    totalOperatingOut: number;
    totalOperatingInLastYear: number;
    totalOperatingOutLastYear: number;
    totalInvesting: number;
    totalInvestingLastYear: number;
    totalInvestingIn: number;
    totalInvestingOut: number;
    totalInvestingInLastYear: number;
    totalInvestingOutLastYear: number;
    totalFinancing: number;
    totalFinancingLastYear: number;
    totalFinancingIn: number;
    totalFinancingOut: number;
    totalFinancingInLastYear: number;
    totalFinancingOutLastYear: number;
    beginningCash: number;
    beginningCashLastYear: number;
    endingCash: number;
    endingCashLastYear: number;
    netChange: number;
    netChangeLastYear: number;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function CashFlow({
    operatingItems,
    investingItems,
    financingItems,
    totalOperating,
    totalOperatingLastYear,
    totalOperatingIn,
    totalOperatingOut,
    totalOperatingInLastYear,
    totalOperatingOutLastYear,
    totalInvesting,
    totalInvestingLastYear,
    totalInvestingIn,
    totalInvestingOut,
    totalInvestingInLastYear,
    totalInvestingOutLastYear,
    totalFinancing,
    totalFinancingLastYear,
    totalFinancingIn,
    totalFinancingOut,
    totalFinancingInLastYear,
    totalFinancingOutLastYear,
    beginningCash,
    beginningCashLastYear,
    endingCash,
    endingCashLastYear,
    netChange,
    netChangeLastYear,
    filters,
}: CashFlowProps) {
    const { errors } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        
        const startYear = new Date(startDate).getFullYear();
        const endYear = new Date(endDate).getFullYear();
        
        if (startYear !== endYear) {
            setLocalError('Rentang tanggal tidak boleh melewati dua tahun yang berbeda.');
            return;
        }
        
        setLocalError(null);
        router.get(
            route('reports.cash-flow'),
            {
                start_date: startDate,
                end_date: endDate,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleReset = () => {
        setLocalError(null);
        const currentYear = new Date().getFullYear();
        const start = `${currentYear}-01-01`;
        const end = new Date().toISOString().split('T')[0];
        setStartDate(start);
        setEndDate(end);
        router.get(route('reports.cash-flow'), {
            start_date: start,
            end_date: end,
        });
    };

    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDateSlash = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateRange = (start: string, end: string) => {
        const s = formatDateSlash(start);
        const e = formatDateSlash(end);
        return `${s} - ${e}`;
    };

    const formatParenthesis = (value: number) => {
        if (value < 0) {
            return `(${formatRupiah(Math.abs(value))})`;
        }
        return formatRupiah(value);
    };

    const currentYear = new Date(filters.end_date).getFullYear();
    const lastYear = currentYear - 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Arus Kas (Cash Flow)" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Laporan Arus Kas</h1>
                        <p className="text-muted-foreground text-sm">
                            Ringkasan pergerakan kas masuk dan keluar berdasarkan aktivitas operasional, investasi, dan pendanaan.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Cetak Laporan
                        </Button>
                    </div>
                </div>

                {/* Error Banner */}
                {(localError || (errors && errors.start_date)) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Kesalahan</AlertTitle>
                        <AlertDescription>{localError || (errors.start_date as string)}</AlertDescription>
                    </Alert>
                )}

                {/* Filter Card */}
                <div className="bg-card rounded-xl border p-4 print:hidden">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-1.5">
                            <label htmlFor="start_date" className="text-sm font-medium">
                                Tanggal Mulai
                            </label>
                            <DatePicker
                                id="start_date"
                                value={startDate}
                                onChange={setStartDate}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="end_date" className="text-sm font-medium">
                                Tanggal Selesai
                            </label>
                            <DatePicker
                                id="end_date"
                                value={endDate}
                                onChange={setEndDate}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="h-9">
                                Terapkan Filter
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="h-9 gap-1.5">
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Report Content */}
                <div className="bg-card mx-auto w-full max-w-4xl rounded-2xl border p-8 shadow-sm print:max-w-none print:border-none print:p-0 print:shadow-none">
                    {/* Document Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Assetory Company</h2>
                        <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">Laporan Arus Kas</h3>
                        <p className="text-sm text-neutral-500 mt-1">Periode: {formatDateRange(filters.start_date, filters.end_date)}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b bg-neutral-50 dark:bg-neutral-900/40 text-[10px] uppercase font-bold text-muted-foreground">
                                    <th className="px-4 py-3 font-semibold text-left">Uraian</th>
                                    <th className="px-4 py-3 text-right font-semibold w-40 font-mono">{currentYear}</th>
                                    <th className="px-4 py-3 text-right font-semibold w-40 font-mono text-muted-foreground">{lastYear}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* OPERATING ACTIVITY */}
                                <tr className="bg-neutral-100/50 dark:bg-neutral-900/40 font-bold border-b text-foreground">
                                    <td className="px-4 py-2.5 text-left text-xs uppercase tracking-wide" colSpan={3}>
                                        Arus Kas Dari Aktivitas Operasi
                                    </td>
                                </tr>
                                <tr className="border-b hover:bg-neutral-50/20 dark:hover:bg-neutral-900/5">
                                    <td className="px-4 py-2 pl-6 text-left">Penerimaan Kas</td>
                                    <td className="px-4 py-2 text-right font-mono">{formatRupiah(totalOperatingIn)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatRupiah(totalOperatingInLastYear)}</td>
                                </tr>
                                <tr className="border-b hover:bg-neutral-50/20 dark:hover:bg-neutral-900/5">
                                    <td className="px-4 py-2 pl-6 text-left">Pengeluaran Kas</td>
                                    <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400">{totalOperatingOut > 0 ? `(${formatRupiah(totalOperatingOut)})` : formatRupiah(0)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-red-500/80 dark:text-red-500/80">{totalOperatingOutLastYear > 0 ? `(${formatRupiah(totalOperatingOutLastYear)})` : formatRupiah(0)}</td>
                                </tr>
                                <tr className="font-semibold border-b bg-neutral-50/30 dark:bg-neutral-900/10 text-foreground">
                                    <td className="px-4 py-2.5 pl-6 text-left">Arus kas bersih dari aktivitas operasi</td>
                                    <td className="px-4 py-2.5 text-right font-mono">{formatParenthesis(totalOperating)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{formatParenthesis(totalOperatingLastYear)}</td>
                                </tr>

                                {/* INVESTING ACTIVITY */}
                                <tr className="bg-neutral-100/50 dark:bg-neutral-900/40 font-bold border-b text-foreground mt-4">
                                    <td className="px-4 py-2.5 text-left text-xs uppercase tracking-wide" colSpan={3}>
                                        Arus Kas Dari Aktivitas Investasi
                                    </td>
                                </tr>
                                <tr className="border-b hover:bg-neutral-50/20 dark:hover:bg-neutral-900/5">
                                    <td className="px-4 py-2 pl-6 text-left">Penerimaan Kas</td>
                                    <td className="px-4 py-2 text-right font-mono">{formatRupiah(totalInvestingIn)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatRupiah(totalInvestingInLastYear)}</td>
                                </tr>
                                <tr className="border-b hover:bg-neutral-50/20 dark:hover:bg-neutral-900/5">
                                    <td className="px-4 py-2 pl-6 text-left">Pengeluaran Kas</td>
                                    <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400">{totalInvestingOut > 0 ? `(${formatRupiah(totalInvestingOut)})` : formatRupiah(0)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-red-500/80 dark:text-red-500/80">{totalInvestingOutLastYear > 0 ? `(${formatRupiah(totalInvestingOutLastYear)})` : formatRupiah(0)}</td>
                                </tr>
                                <tr className="font-semibold border-b bg-neutral-50/30 dark:bg-neutral-900/10 text-foreground">
                                    <td className="px-4 py-2.5 pl-6 text-left">Arus kas bersih dari aktivitas investasi</td>
                                    <td className="px-4 py-2.5 text-right font-mono">{formatParenthesis(totalInvesting)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{formatParenthesis(totalInvestingLastYear)}</td>
                                </tr>

                                {/* FINANCING ACTIVITY */}
                                <tr className="bg-neutral-100/50 dark:bg-neutral-900/40 font-bold border-b text-foreground mt-4">
                                    <td className="px-4 py-2.5 text-left text-xs uppercase tracking-wide" colSpan={3}>
                                        Arus Kas Dari Aktivitas Pendanaan
                                    </td>
                                </tr>
                                <tr className="border-b hover:bg-neutral-50/20 dark:hover:bg-neutral-900/5">
                                    <td className="px-4 py-2 pl-6 text-left">Penerimaan Kas</td>
                                    <td className="px-4 py-2 text-right font-mono">{formatRupiah(totalFinancingIn)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-muted-foreground">{formatRupiah(totalFinancingInLastYear)}</td>
                                </tr>
                                <tr className="border-b hover:bg-neutral-50/20 dark:hover:bg-neutral-900/5">
                                    <td className="px-4 py-2 pl-6 text-left">Pengeluaran Kas</td>
                                    <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400">{totalFinancingOut > 0 ? `(${formatRupiah(totalFinancingOut)})` : formatRupiah(0)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-red-500/80 dark:text-red-500/80">{totalFinancingOutLastYear > 0 ? `(${formatRupiah(totalFinancingOutLastYear)})` : formatRupiah(0)}</td>
                                </tr>
                                <tr className="font-semibold border-b bg-neutral-50/30 dark:bg-neutral-900/10 text-foreground">
                                    <td className="px-4 py-2.5 pl-6 text-left">Arus kas bersih dari aktivitas pendanaan</td>
                                    <td className="px-4 py-2.5 text-right font-mono">{formatParenthesis(totalFinancing)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{formatParenthesis(totalFinancingLastYear)}</td>
                                </tr>

                                {/* Final Cash Balance summary */}
                                <tr className="bg-neutral-50/50 dark:bg-neutral-900/30 border-t-2 font-semibold">
                                    <td className="px-4 py-3 text-foreground">Kenaikan (Penurunan) Bersih Kas</td>
                                    <td className="px-4 py-3 text-right font-mono">{formatParenthesis(netChange)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatParenthesis(netChangeLastYear)}</td>
                                </tr>
                                <tr className="border-b font-semibold">
                                    <td className="px-4 py-3 text-foreground">Saldo Kas Awal Periode</td>
                                    <td className="px-4 py-3 text-right font-mono">{formatRupiah(beginningCash)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatRupiah(beginningCashLastYear)}</td>
                                </tr>
                                <tr className="bg-neutral-100/50 dark:bg-neutral-900/40 border-b-2 font-bold text-foreground">
                                    <td className="px-4 py-3 uppercase">Saldo Kas Akhir Periode</td>
                                    <td className="px-4 py-3 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">{formatRupiah(endingCash)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-base text-emerald-500/80 dark:text-emerald-500/80">{formatRupiah(endingCashLastYear)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Report Footer (visible on print) */}
                    <div className="mt-16 hidden justify-between text-center print:flex">
                        <div className="w-48 border-t border-neutral-400 pt-2 text-sm text-neutral-500">
                            Dibuat Oleh, <br /><br /><br /><br />
                            ( Staff Akunting )
                        </div>
                        <div className="w-48 border-t border-neutral-400 pt-2 text-sm text-neutral-500">
                            Disetujui Oleh, <br /><br /><br /><br />
                            ( Pemilik Perusahaan )
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
