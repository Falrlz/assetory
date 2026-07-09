import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Calendar, FileText, Printer, RotateCcw } from 'lucide-react';
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
    totalInvesting: number;
    totalFinancing: number;
    beginningCash: number;
    endingCash: number;
    netChange: number;
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
    totalInvesting,
    totalFinancing,
    beginningCash,
    endingCash,
    netChange,
    filters,
}: CashFlowProps) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('reports.cash-flow'), {
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

    const formatDateRange = (start: string, end: string) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const s = new Date(start).toLocaleDateString('id-ID', options);
        const e = new Date(end).toLocaleDateString('id-ID', options);
        return `${s} - ${e}`;
    };

    const renderCashItems = (items: CashItem[]) => {
        if (items.length === 0) {
            return (
                <div className="text-xs text-muted-foreground italic py-1 pl-4">
                    Tidak ada aktivitas kas.
                </div>
            );
        }

        return (
            <div className="space-y-1.5 pl-4">
                {items.map((item, idx) => {
                    const cin = parseFloat(item.cash_in as string) || 0;
                    const cout = parseFloat(item.cash_out as string) || 0;
                    const diff = cin - cout;
                    return (
                        <div key={idx} className="flex justify-between text-sm py-1 border-b border-border/20 last:border-0 hover:bg-muted/10">
                            <div>
                                <span className="font-medium text-foreground">{item.keterangan}</span>
                                <span className="text-[10px] text-muted-foreground block font-mono">
                                    {item.nomor_jurnal} &bull; {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                </span>
                            </div>
                            <span className={`font-mono text-xs font-semibold ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {diff >= 0 ? '+' : ''}{formatRupiah(diff)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

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
                        <h1 className="text-2xl font-bold">Laporan Arus Kas (Cash Flow)</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Periode: {formatDateRange(filters.start_date, filters.end_date)}
                        </p>
                        <hr className="my-4 border-gray-300" />
                    </div>

                    <div className="hidden print:hidden md:block text-center mb-8">
                        <h2 className="text-md font-semibold text-muted-foreground uppercase">Laporan Mutasi Kas</h2>
                        <h1 className="text-2xl font-bold text-foreground mt-0.5">LAPORAN ARUS KAS</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Periode {formatDateRange(filters.start_date, filters.end_date)}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* 1. OPERATING ACTIVITIES */}
                        <div className="space-y-2.5">
                            <div className="border-b pb-1">
                                <h3 className="text-sm font-bold text-primary tracking-wider uppercase">1. ARUS KAS DARI AKTIVITAS OPERASIONAL</h3>
                            </div>
                            {renderCashItems(operatingItems)}
                            <div className="flex justify-between text-sm font-semibold p-2 bg-muted/20 border rounded-lg">
                                <span>Kas Bersih Dari Aktivitas Operasional</span>
                                <span className="font-mono">{formatRupiah(totalOperating)}</span>
                            </div>
                        </div>

                        {/* 2. INVESTING ACTIVITIES */}
                        <div className="space-y-2.5">
                            <div className="border-b pb-1">
                                <h3 className="text-sm font-bold text-primary tracking-wider uppercase">2. ARUS KAS DARI AKTIVITAS INVESTASI</h3>
                            </div>
                            {renderCashItems(investingItems)}
                            <div className="flex justify-between text-sm font-semibold p-2 bg-muted/20 border rounded-lg">
                                <span>Kas Bersih Dari Aktivitas Investasi</span>
                                <span className="font-mono">{formatRupiah(totalInvesting)}</span>
                            </div>
                        </div>

                        {/* 3. FINANCING ACTIVITIES */}
                        <div className="space-y-2.5">
                            <div className="border-b pb-1">
                                <h3 className="text-sm font-bold text-primary tracking-wider uppercase">3. ARUS KAS DARI AKTIVITAS PENDANAAN</h3>
                            </div>
                            {renderCashItems(financingItems)}
                            <div className="flex justify-between text-sm font-semibold p-2 bg-muted/20 border rounded-lg">
                                <span>Kas Bersih Dari Aktivitas Pendanaan</span>
                                <span className="font-mono">{formatRupiah(totalFinancing)}</span>
                            </div>
                        </div>

                        {/* SUMMARY OF CASH CHANGE */}
                        <div className="pt-6 space-y-3.5">
                            <div className="border-t-2 border-border/80 pt-4 space-y-2.5">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Kenaikan (Penurunan) Bersih Kas</span>
                                    <span className="font-mono">{formatRupiah(netChange)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                                    <span>Saldo Kas Awal Periode</span>
                                    <span className="font-mono">{formatRupiah(beginningCash)}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold bg-primary/10 text-primary p-3 rounded-lg border border-primary/20">
                                    <span>SALDO KAS AKHIR PERIODE</span>
                                    <span className="font-mono">{formatRupiah(endingCash)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
