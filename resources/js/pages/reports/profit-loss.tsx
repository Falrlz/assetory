import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Calendar, FileText, Printer, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
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
    revenues: Account[];
    expenses: Account[];
    totalRevenues: number;
    totalExpenses: number;
    netProfit: number;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function ProfitLoss({
    revenues,
    expenses,
    totalRevenues,
    totalExpenses,
    netProfit,
    filters,
}: ProfitLossProps) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('reports.profit-loss'), {
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
        });
    };

    const handleReset = () => {
        const start = new Date(new Date().getFullYear(), 0, 2).toISOString().split('T')[0]; // Jan 1st
        const end = new Date(new Date().getFullYear(), 11, 32).toISOString().split('T')[0]; // Dec 31st
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

    const formatDateRange = (start: string, end: string) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const s = new Date(start).toLocaleDateString('id-ID', options);
        const e = new Date(end).toLocaleDateString('id-ID', options);
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

                {/* Filter Card */}
                <div className="bg-card rounded-xl border p-4 print:hidden">
                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-1.5">
                            <label htmlFor="start_date" className="text-sm font-medium">Tanggal Mulai</label>
                            <input
                                type="date"
                                id="start_date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="end_date" className="text-sm font-medium">Tanggal Selesai</label>
                            <input
                                type="date"
                                id="end_date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-input bg-background text-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
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
                <div className="bg-card rounded-xl border p-6 md:p-8 max-w-4xl mx-auto w-full print:border-none print:shadow-none print:p-0 print:max-w-none">
                    {/* Print Only Header */}
                    <div className="hidden print:block text-center mb-6">
                        <h2 className="text-xl font-bold uppercase">Assetory</h2>
                        <h1 className="text-2xl font-bold">Laporan Laba Rugi (Profit & Loss)</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Periode: {formatDateRange(filters.start_date, filters.end_date)}
                        </p>
                        <hr className="my-4 border-gray-300" />
                    </div>

                    <div className="hidden print:hidden md:block text-center mb-8">
                        <h2 className="text-md font-semibold text-muted-foreground uppercase">Laporan Kinerja Keuangan</h2>
                        <h1 className="text-2xl font-bold text-foreground mt-0.5">LAPORAN LABA RUGI</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Periode {formatDateRange(filters.start_date, filters.end_date)}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* REVENUES SECTION */}
                        <div className="space-y-3">
                            <div className="border-b pb-1">
                                <h3 className="text-sm font-bold text-primary tracking-wider uppercase">PENDAPATAN</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {revenues.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="text-muted-foreground py-2 text-center">Tidak ada pendapatan tercatat.</td>
                                        </tr>
                                    ) : (
                                        revenues.map((item) => (
                                            <tr key={item.id} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                                                <td className="py-2.5 font-mono text-xs w-28 text-muted-foreground">{item.kode_akun}</td>
                                                <td className="py-2.5 font-medium">{item.nama_akun}</td>
                                                <td className="py-2.5 text-right font-mono font-medium">{formatRupiah(item.saldo)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                                <span className="font-semibold text-sm">TOTAL PENDAPATAN</span>
                                <span className="font-bold font-mono text-sm">{formatRupiah(totalRevenues)}</span>
                            </div>
                        </div>

                        {/* EXPENSES SECTION */}
                        <div className="space-y-3">
                            <div className="border-b pb-1">
                                <h3 className="text-sm font-bold text-primary tracking-wider uppercase">BEBAN OPERASIONAL & PENYUSUTAN</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="text-muted-foreground py-2 text-center">Tidak ada beban tercatat.</td>
                                        </tr>
                                    ) : (
                                        expenses.map((item) => (
                                            <tr key={item.id} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                                                <td className="py-2.5 font-mono text-xs w-28 text-muted-foreground">{item.kode_akun}</td>
                                                <td className="py-2.5 font-medium">{item.nama_akun}</td>
                                                <td className="py-2.5 text-right font-mono font-medium">{formatRupiah(item.saldo)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                                <span className="font-semibold text-sm">TOTAL BEBAN</span>
                                <span className="font-bold font-mono text-sm">{formatRupiah(totalExpenses)}</span>
                            </div>
                        </div>

                        {/* NET PROFIT/LOSS FOOTER */}
                        <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                            netProfit >= 0
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-950/20'
                                : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400 dark:bg-red-950/20'
                        }`}>
                            <div className="flex items-center gap-2">
                                {netProfit >= 0 ? (
                                    <TrendingUp className="h-5 w-5" />
                                ) : (
                                    <TrendingDown className="h-5 w-5" />
                                )}
                                <span className="font-bold text-sm md:text-base uppercase">
                                    {netProfit >= 0 ? 'LABA BERSIH (NET INCOME)' : 'RUGI BERSIH (NET LOSS)'}
                                </span>
                            </div>
                            <span className="font-bold font-mono text-lg md:text-xl">
                                {formatRupiah(netProfit)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
