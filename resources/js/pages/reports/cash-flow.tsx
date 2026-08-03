import { Field, PageShell } from '@/components/page-header';
import { ReportDocument, ReportFilterCard, ReportSignatures, ReportToolbar } from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { Fragment, useState } from 'react';

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
    hasAppliedFilter?: boolean;
    filters: {
        year?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function CashFlow({
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
    hasAppliedFilter = false,
    filters,
}: CashFlowProps) {
    const { errors } = usePage().props;
    const [selectedYear, setSelectedYear] = useState<string>(filters.year || '');
    const [localError, setLocalError] = useState<string | null>(null);

    const currentCalendarYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 7 }, (_, i) => (currentCalendarYear - 5 + i).toString());

    const currentYear = selectedYear || currentCalendarYear.toString();
    const lastYear = (parseInt(currentYear, 10) - 1).toString();

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedYear) {
            setLocalError('Silakan pilih Tahun Buku laporan terlebih dahulu.');
            return;
        }

        setLocalError(null);
        router.get(
            route('reports.cash-flow'),
            {
                year: selectedYear,
            },
            {
                preserveState: true,
            },
        );
    };

    const handleReset = () => {
        setLocalError(null);
        setSelectedYear('');
        router.get(route('reports.cash-flow'), {});
    };

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    /** Negative cash flows print in parentheses, per accounting convention. */
    const formatParenthesis = (value: number) => (value < 0 ? `(${formatRupiah(Math.abs(value))})` : formatRupiah(value));

    const activities = [
        {
            title: 'Arus Kas dari Aktivitas Operasi',
            netLabel: 'Arus kas bersih dari aktivitas operasi',
            cashIn: totalOperatingIn,
            cashInLastYear: totalOperatingInLastYear,
            cashOut: totalOperatingOut,
            cashOutLastYear: totalOperatingOutLastYear,
            net: totalOperating,
            netLastYear: totalOperatingLastYear,
        },
        {
            title: 'Arus Kas dari Aktivitas Investasi',
            netLabel: 'Arus kas bersih dari aktivitas investasi',
            cashIn: totalInvestingIn,
            cashInLastYear: totalInvestingInLastYear,
            cashOut: totalInvestingOut,
            cashOutLastYear: totalInvestingOutLastYear,
            net: totalInvesting,
            netLastYear: totalInvestingLastYear,
        },
        {
            title: 'Arus Kas dari Aktivitas Pendanaan',
            netLabel: 'Arus kas bersih dari aktivitas pendanaan',
            cashIn: totalFinancingIn,
            cashInLastYear: totalFinancingInLastYear,
            cashOut: totalFinancingOut,
            cashOutLastYear: totalFinancingOutLastYear,
            net: totalFinancing,
            netLastYear: totalFinancingLastYear,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Arus Kas (Cash Flow)" />

            <PageShell className="print:p-0">
                <ReportToolbar
                    title="Laporan Arus Kas"
                    description="Ringkasan pergerakan kas masuk dan keluar berdasarkan aktivitas operasional, investasi, dan pendanaan."
                />

                {(localError || (errors && errors.year)) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Kesalahan</AlertTitle>
                        <AlertDescription>{localError || (errors.year as string)}</AlertDescription>
                    </Alert>
                )}

                <ReportFilterCard onSubmit={handleFilter} onReset={handleReset} disabled={!selectedYear}>
                    <Field className="w-56">
                        <Label htmlFor="year">Pilih Tahun Buku</Label>
                        <select
                            id="year"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                        >
                            <option value="">-- Pilih Tahun --</option>
                            {availableYears.map((y) => (
                                <option key={y} value={y}>
                                    Tahun Buku {y}
                                </option>
                            ))}
                        </select>
                    </Field>
                </ReportFilterCard>

                {!hasAppliedFilter ? (
                    <div className="bg-card flex flex-col items-center justify-center rounded-xl border p-12 text-center shadow-xs">
                        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                            <AlertCircle className="text-muted-foreground size-6" />
                        </div>
                        <h3 className="text-foreground mt-4 text-base font-semibold">Silakan Pilih Tahun Buku Laporan</h3>
                        <p className="text-muted-foreground mt-1.5 max-w-sm text-xs">
                            Pilih <span className="font-semibold">Tahun Buku</span> di atas, lalu klik tombol{' '}
                            <span className="font-semibold">"Tampilkan Laporan"</span> untuk memuat Arus Kas.
                        </p>
                    </div>
                ) : (
                    <ReportDocument
                        className="mx-auto w-full max-w-4xl print:max-w-none"
                        title="Laporan Arus Kas"
                        period={`Tahun Buku ${selectedYear} (1 Jan ${selectedYear} - 31 Des ${selectedYear})`}
                    >
                        <Table minWidth="min-w-[620px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Uraian</TableHead>
                                    <TableHead align="right" className="w-44">
                                        {currentYear}
                                    </TableHead>
                                    <TableHead align="right" className="w-44">
                                        {lastYear}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.map((activity) => (
                                    <Fragment key={activity.title}>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableCell colSpan={3} className="text-foreground text-xs font-bold tracking-wide uppercase">
                                                {activity.title}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="pl-6 sm:pl-8">Penerimaan Kas</TableCell>
                                            <TableCell numeric>{formatRupiah(activity.cashIn)}</TableCell>
                                            <TableCell numeric className="text-muted-foreground">
                                                {formatRupiah(activity.cashInLastYear)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="pl-6 sm:pl-8">Pengeluaran Kas</TableCell>
                                            <TableCell numeric className="text-rose-600 dark:text-rose-400">
                                                {activity.cashOut > 0 ? `(${formatRupiah(activity.cashOut)})` : formatRupiah(0)}
                                            </TableCell>
                                            <TableCell numeric className="text-rose-500/80">
                                                {activity.cashOutLastYear > 0 ? `(${formatRupiah(activity.cashOutLastYear)})` : formatRupiah(0)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className="bg-muted/20 hover:bg-muted/20 font-semibold">
                                            <TableCell className="text-foreground pl-6 sm:pl-8">{activity.netLabel}</TableCell>
                                            <TableCell numeric className="font-semibold">
                                                {formatParenthesis(activity.net)}
                                            </TableCell>
                                            <TableCell numeric className="text-muted-foreground font-semibold">
                                                {formatParenthesis(activity.netLastYear)}
                                            </TableCell>
                                        </TableRow>
                                    </Fragment>
                                ))}

                                {/* Final Cash Balance summary */}
                                <TableRow className="border-t-2 font-semibold">
                                    <TableCell className="text-foreground">Kenaikan (Penurunan) Bersih Kas</TableCell>
                                    <TableCell numeric className="font-semibold">
                                        {formatParenthesis(netChange)}
                                    </TableCell>
                                    <TableCell numeric className="text-muted-foreground font-semibold">
                                        {formatParenthesis(netChangeLastYear)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="font-semibold">
                                    <TableCell className="text-foreground">Saldo Kas Awal Periode</TableCell>
                                    <TableCell numeric className="font-semibold">
                                        {formatRupiah(beginningCash)}
                                    </TableCell>
                                    <TableCell numeric className="text-muted-foreground font-semibold">
                                        {formatRupiah(beginningCashLastYear)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/40 hover:bg-muted/40 border-t-2 font-bold">
                                    <TableCell className="text-foreground uppercase">Saldo Kas Akhir Periode</TableCell>
                                    <TableCell numeric className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(endingCash)}
                                    </TableCell>
                                    <TableCell numeric className="text-base font-bold text-emerald-500/80">
                                        {formatRupiah(endingCashLastYear)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                        <ReportSignatures />
                    </ReportDocument>
                )}
            </PageShell>
        </AppLayout>
    );
}
