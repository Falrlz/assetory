import { Field, PageShell } from '@/components/page-header';
import {
    AccountTable,
    ReportDocument,
    ReportFilterCard,
    ReportSection,
    ReportToolbar,
    TotalRow,
    type ReportAccount,
} from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laba dan Rugi',
        href: '/reports/profit-loss',
    },
];

interface ProfitLossProps {
    revenues: ReportAccount[];
    expenses: ReportAccount[];
    totalRevenues: number;
    totalRevenuesLastYear: number;
    totalExpenses: number;
    totalExpensesLastYear: number;
    netProfit: number;
    netProfitLastYear: number;
    hasAppliedFilter?: boolean;
    filters: {
        year?: string;
        start_date?: string;
        end_date?: string;
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
    hasAppliedFilter = false,
    filters,
}: ProfitLossProps) {
    const { errors } = usePage().props;
    const [selectedYear, setSelectedYear] = useState<string>(filters.year || '');
    const [localError, setLocalError] = useState<string | null>(null);

    const currentYearNum = selectedYear ? parseInt(selectedYear, 10) : new Date().getFullYear();
    const lastYearNum = currentYearNum - 1;

    // Generate option years (e.g. 5 years back to next year)
    const currentCalendarYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 7 }, (_, i) => (currentCalendarYear - 5 + i).toString());

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedYear) {
            setLocalError('Silakan pilih Tahun Buku laporan terlebih dahulu.');
            return;
        }

        setLocalError(null);
        router.get(
            route('reports.profit-loss'),
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
        router.get(route('reports.profit-loss'), {});
    };

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    const isProfit = netProfit >= 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Laba Rugi (Profit & Loss)" />

            <PageShell className="print:p-0">
                <ReportToolbar
                    title="Laporan Laba Rugi"
                    description="Ringkasan pendapatan dan beban untuk mengukur keuntungan atau kerugian dalam satu Tahun Buku."
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
                            <span className="font-semibold">"Tampilkan Laporan"</span> untuk memuat data Laba Rugi.
                        </p>
                    </div>
                ) : (
                    <ReportDocument
                        className="mx-auto w-full max-w-4xl print:max-w-none"
                        title="Laporan Laba Rugi"
                        period={`Tahun Buku ${selectedYear} (1 Jan ${selectedYear} - 31 Des ${selectedYear})`}
                    >
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <ReportSection title="Pendapatan">
                                    <AccountTable
                                        accounts={revenues}
                                        currentYear={currentYearNum}
                                        lastYear={lastYearNum}
                                        emptyLabel="Tidak ada pendapatan tercatat pada tahun ini."
                                        format={formatRupiah}
                                    />
                                </ReportSection>
                                <TotalRow
                                    label="Total Pendapatan"
                                    current={formatRupiah(totalRevenues)}
                                    previous={formatRupiah(totalRevenuesLastYear)}
                                    currentYear={currentYearNum}
                                    lastYear={lastYearNum}
                                />
                            </div>

                            <div className="space-y-3">
                                <ReportSection title="Beban Operasional & Penyusutan">
                                    <AccountTable
                                        accounts={expenses}
                                        currentYear={currentYearNum}
                                        lastYear={lastYearNum}
                                        emptyLabel="Tidak ada beban tercatat pada tahun ini."
                                        format={formatRupiah}
                                    />
                                </ReportSection>
                                <TotalRow
                                    label="Total Beban"
                                    current={formatRupiah(totalExpenses)}
                                    previous={formatRupiah(totalExpensesLastYear)}
                                    currentYear={currentYearNum}
                                    lastYear={lastYearNum}
                                />
                            </div>

                            <TotalRow
                                label={isProfit ? 'Laba Bersih (Net Income)' : 'Rugi Bersih (Net Loss)'}
                                emphasis="strong"
                                icon={
                                    isProfit ? (
                                        <TrendingUp className="size-5" aria-hidden="true" />
                                    ) : (
                                        <TrendingDown className="size-5" aria-hidden="true" />
                                    )
                                }
                                className={
                                    isProfit
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                }
                                current={formatRupiah(netProfit)}
                                previous={formatRupiah(netProfitLastYear)}
                                currentYear={currentYearNum}
                                lastYear={lastYearNum}
                            />
                        </div>
                    </ReportDocument>
                )}
            </PageShell>
        </AppLayout>
    );
}
