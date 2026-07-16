import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
        const end = `${currentYear}-12-31`;
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
            return <div className="text-muted-foreground py-1 pl-4 text-xs italic">Tidak ada aktivitas kas.</div>;
        }

        return (
            <div className="space-y-1.5 pl-4">
                {items.map((item, idx) => {
                    const cin = parseFloat(item.cash_in as string) || 0;
                    const cout = parseFloat(item.cash_out as string) || 0;
                    const diff = cin - cout;
                    return (
                        <div key={idx} className="border-border/20 hover:bg-muted/10 flex justify-between border-b py-1 text-sm last:border-0">
                            <div>
                                <span className="text-foreground font-medium">{item.keterangan}</span>
                                <span className="text-muted-foreground block font-mono text-[10px]">
                                    {item.nomor_jurnal} &bull; {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                </span>
                            </div>
                            <span
                                className={`font-mono text-xs font-semibold ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
                            >
                                {diff >= 0 ? '+' : ''}
                                {formatRupiah(diff)}
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
                            <input
                                type="date"
                                id="start_date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-input bg-background text-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="end_date" className="text-sm font-medium">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                id="end_date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-input bg-background text-foreground focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
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
                        <h1 className="text-2xl font-bold">Laporan Arus Kas (Cash Flow)</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Periode: {formatDateRange(filters.start_date, filters.end_date)}</p>
                        <hr className="my-4 border-gray-300" />
                    </div>

                    <div className="mb-8 hidden text-center md:block print:hidden">
                        <h2 className="text-md text-muted-foreground font-semibold uppercase">Laporan Mutasi Kas</h2>
                        <h1 className="text-foreground mt-0.5 text-2xl font-bold">LAPORAN ARUS KAS</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Periode {formatDateRange(filters.start_date, filters.end_date)}</p>
                    </div>

                    <div className="space-y-6">
                        {/* 1. OPERATING ACTIVITIES */}
                        <div className="space-y-2.5">
                            <div className="border-b pb-1">
                                <h3 className="text-primary text-sm font-bold tracking-wider uppercase">1. ARUS KAS DARI AKTIVITAS OPERASIONAL</h3>
                            </div>
                            {renderCashItems(operatingItems)}
                            <div className="bg-muted/20 flex justify-between rounded-lg border p-2 text-sm font-semibold">
                                <span>Kas Bersih Dari Aktivitas Operasional</span>
                                <span className="font-mono">{formatRupiah(totalOperating)}</span>
                            </div>
                        </div>

                        {/* 2. INVESTING ACTIVITIES */}
                        <div className="space-y-2.5">
                            <div className="border-b pb-1">
                                <h3 className="text-primary text-sm font-bold tracking-wider uppercase">2. ARUS KAS DARI AKTIVITAS INVESTASI</h3>
                            </div>
                            {renderCashItems(investingItems)}
                            <div className="bg-muted/20 flex justify-between rounded-lg border p-2 text-sm font-semibold">
                                <span>Kas Bersih Dari Aktivitas Investasi</span>
                                <span className="font-mono">{formatRupiah(totalInvesting)}</span>
                            </div>
                        </div>

                        {/* 3. FINANCING ACTIVITIES */}
                        <div className="space-y-2.5">
                            <div className="border-b pb-1">
                                <h3 className="text-primary text-sm font-bold tracking-wider uppercase">3. ARUS KAS DARI AKTIVITAS PENDANAAN</h3>
                            </div>
                            {renderCashItems(financingItems)}
                            <div className="bg-muted/20 flex justify-between rounded-lg border p-2 text-sm font-semibold">
                                <span>Kas Bersih Dari Aktivitas Pendanaan</span>
                                <span className="font-mono">{formatRupiah(totalFinancing)}</span>
                            </div>
                        </div>

                        {/* SUMMARY OF CASH CHANGE */}
                        <div className="space-y-3.5 pt-6">
                            <div className="border-border/80 space-y-2.5 border-t-2 pt-4">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Kenaikan (Penurunan) Bersih Kas</span>
                                    <span className="font-mono">{formatRupiah(netChange)}</span>
                                </div>
                                <div className="text-muted-foreground flex justify-between text-sm font-medium">
                                    <span>Saldo Kas Awal Periode</span>
                                    <span className="font-mono">{formatRupiah(beginningCash)}</span>
                                </div>
                                <div className="bg-primary/10 text-primary border-primary/20 flex justify-between rounded-lg border p-3 text-base font-bold">
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
