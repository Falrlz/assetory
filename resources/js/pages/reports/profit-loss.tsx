import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Printer, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laba dan Rugi',
        href: '/reports/profit-loss',
    },
];

interface Account {
    id: number;
    kode_akun: string;
    nama_akun: string;
    kategori: string;
    saldo: number;
}

interface ProfitLossProps {
    revenues: (Account & { saldo_last_year: number })[];
    expenses: (Account & { saldo_last_year: number })[];
    totalRevenues: number;
    totalRevenuesLastYear: number;
    totalExpenses: number;
    totalExpensesLastYear: number;
    netProfit: number;
    netProfitLastYear: number;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function ProfitLoss({
    revenues,
    expenses,
    totalRevenues,
    totalRevenuesLastYear,
    totalExpenses,
    totalExpensesLastYear,
    netProfit,
    netProfitLastYear,
    filters,
}: ProfitLossProps) {
    const { errors } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [localError, setLocalError] = useState<string | null>(null);

    const currentYear = new Date(filters.end_date).getFullYear();
    const lastYear = currentYear - 1;

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
            route('reports.profit-loss'),
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
        router.get(route('reports.profit-loss'), {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Laba Rugi (Profit & Loss)" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Laporan Laba Rugi</h1>
                        <p className="text-muted-foreground text-sm">
                            Ringkasan pendapatan dan beban untuk mengukur keuntungan atau kerugian dalam periode tertentu.
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
                <div className="bg-card mx-auto w-full max-w-4xl rounded-xl border p-6 md:p-8 print:max-w-none print:border-none print:p-0 print:shadow-none">
                    {/* Print Only Header */}
                    <div className="mb-6 hidden text-center print:block">
                        <h2 className="text-xl font-bold uppercase">Assetory</h2>
                        <h1 className="text-2xl font-bold">Laporan Laba Rugi (Profit & Loss)</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Periode: {formatDateRange(filters.start_date, filters.end_date)}</p>
                        <hr className="my-4 border-gray-300" />
                    </div>

                    <div className="mb-8 hidden text-center md:block print:hidden">
                                    <h2 className="text-md text-muted-foreground font-semibold uppercase">Laporan Kinerja Keuangan</h2>
                                    <h1 className="text-foreground mt-0.5 text-2xl font-bold">LAPORAN LABA RUGI</h1>
                                    <p className="text-muted-foreground mt-1 text-sm">Periode {formatDateRange(filters.start_date, filters.end_date)}</p>
                                </div>

                                <div className="space-y-8">
                                    {/* REVENUES SECTION */}
                                    <div className="space-y-3">
                                        <div className="border-b pb-1">
                                            <h3 className="text-primary text-sm font-bold tracking-wider uppercase">PENDAPATAN</h3>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-muted-foreground border-b border-border/40 text-[10px] font-bold uppercase">
                                                    <th className="py-2 font-semibold text-left">Kode</th>
                                                    <th className="py-2 font-semibold text-left">Nama Akun</th>
                                                    <th className="w-28 py-2 text-right font-semibold font-mono">{currentYear}</th>
                                                    <th className="w-28 py-2 text-right font-semibold font-mono text-muted-foreground">{lastYear}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {revenues.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-muted-foreground py-2 text-center">
                                                            Tidak ada pendapatan tercatat.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    revenues.map((item) => (
                                                        <tr key={item.id} className="border-border/40 hover:bg-muted/10 border-b last:border-0">
                                                            <td className="text-muted-foreground w-20 py-2.5 font-mono text-xs">{item.kode_akun}</td>
                                                            <td className="py-2.5 font-medium">{item.nama_akun}</td>
                                                            <td className="py-2.5 text-right font-mono font-medium">{formatRupiah(item.saldo)}</td>
                                                            <td className="py-2.5 text-right font-mono text-muted-foreground">{formatRupiah(item.saldo_last_year || 0)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                                            <span className="text-xs font-semibold uppercase">TOTAL PENDAPATAN</span>
                                            <div className="flex gap-4 text-right">
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground block font-bold">{currentYear}</span>
                                                    <span className="font-mono text-sm font-bold">{formatRupiah(totalRevenues)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground block font-bold">{lastYear}</span>
                                                    <span className="font-mono text-sm text-muted-foreground font-medium">{formatRupiah(totalRevenuesLastYear)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* EXPENSES SECTION */}
                                    <div className="space-y-3">
                                        <div className="border-b pb-1">
                                            <h3 className="text-primary text-sm font-bold tracking-wider uppercase">BEBAN OPERASIONAL & PENYUSUTAN</h3>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-muted-foreground border-b border-border/40 text-[10px] font-bold uppercase">
                                                    <th className="py-2 font-semibold text-left">Kode</th>
                                                    <th className="py-2 font-semibold text-left">Nama Akun</th>
                                                    <th className="w-28 py-2 text-right font-semibold font-mono">{currentYear}</th>
                                                    <th className="w-28 py-2 text-right font-semibold font-mono text-muted-foreground">{lastYear}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-muted-foreground py-2 text-center">
                                                            Tidak ada beban tercatat.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    expenses.map((item) => (
                                                        <tr key={item.id} className="border-border/40 hover:bg-muted/10 border-b last:border-0">
                                                            <td className="text-muted-foreground w-20 py-2.5 font-mono text-xs">{item.kode_akun}</td>
                                                            <td className="py-2.5 font-medium">{item.nama_akun}</td>
                                                            <td className="py-2.5 text-right font-mono font-medium">{formatRupiah(item.saldo)}</td>
                                                            <td className="py-2.5 text-right font-mono text-muted-foreground">{formatRupiah(item.saldo_last_year || 0)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-2.5">
                                            <span className="text-xs font-semibold uppercase">TOTAL BEBAN</span>
                                            <div className="flex gap-4 text-right">
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground block font-bold">{currentYear}</span>
                                                    <span className="font-mono text-sm font-bold">{formatRupiah(totalExpenses)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground block font-bold">{lastYear}</span>
                                                    <span className="font-mono text-sm text-muted-foreground font-medium">{formatRupiah(totalExpensesLastYear)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* NET PROFIT/LOSS FOOTER */}
                                    <div
                                        className={`flex items-center justify-between rounded-xl border-2 p-4 ${
                                            netProfit >= 0
                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                : 'border-red-500/20 bg-red-500/10 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {netProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                            <span className="text-sm font-bold uppercase md:text-base">
                                                {netProfit >= 0 ? 'LABA BERSIH (NET INCOME)' : 'RUGI BERSIH (NET LOSS)'}
                                            </span>
                                        </div>
                                        <div className="flex gap-6 text-right">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block font-bold">{currentYear}</span>
                                                <span className="font-mono text-base font-bold md:text-lg">{formatRupiah(netProfit)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block font-bold">{lastYear}</span>
                                                <span className="font-mono text-base text-muted-foreground font-medium md:text-lg">{formatRupiah(netProfitLastYear)}</span>
                                            </div>
                                        </div>
                                </div>
                            </div>
                </div>
            </div>
        </AppLayout>
    );
}
