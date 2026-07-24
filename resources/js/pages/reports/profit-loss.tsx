import { Field, PageShell } from '@/components/page-header';
import {
    AccountTable,
    formatDateRange,
    ReportDocument,
    ReportFilterCard,
    ReportSection,
    ReportToolbar,
    TotalRow,
    type ReportAccount,
} from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
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
        const year = new Date().getFullYear();
        const start = `${year}-01-01`;
        const end = new Date().toISOString().split('T')[0];
        setStartDate(start);
        setEndDate(end);
        router.get(route('reports.profit-loss'), {
            start_date: start,
            end_date: end,
        });
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
                    description="Ringkasan pendapatan dan beban untuk mengukur keuntungan atau kerugian dalam periode tertentu."
                />

                {(localError || (errors && errors.start_date)) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Kesalahan</AlertTitle>
                        <AlertDescription>{localError || (errors.start_date as string)}</AlertDescription>
                    </Alert>
                )}

                <ReportFilterCard onSubmit={handleFilter} onReset={handleReset}>
                    <Field className="w-48">
                        <Label htmlFor="start_date">Tanggal Mulai</Label>
                        <DatePicker id="start_date" value={startDate} onChange={setStartDate} />
                    </Field>
                    <Field className="w-48">
                        <Label htmlFor="end_date">Tanggal Selesai</Label>
                        <DatePicker id="end_date" value={endDate} onChange={setEndDate} />
                    </Field>
                </ReportFilterCard>

                <ReportDocument
                    className="mx-auto w-full max-w-4xl print:max-w-none"
                    title="Laporan Laba Rugi"
                    period={`Periode ${formatDateRange(filters.start_date, filters.end_date)}`}
                >
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <ReportSection title="Pendapatan">
                                <AccountTable
                                    accounts={revenues}
                                    currentYear={currentYear}
                                    lastYear={lastYear}
                                    emptyLabel="Tidak ada pendapatan tercatat."
                                    format={formatRupiah}
                                />
                            </ReportSection>
                            <TotalRow
                                label="Total Pendapatan"
                                current={formatRupiah(totalRevenues)}
                                previous={formatRupiah(totalRevenuesLastYear)}
                                currentYear={currentYear}
                                lastYear={lastYear}
                            />
                        </div>

                        <div className="space-y-3">
                            <ReportSection title="Beban Operasional & Penyusutan">
                                <AccountTable
                                    accounts={expenses}
                                    currentYear={currentYear}
                                    lastYear={lastYear}
                                    emptyLabel="Tidak ada beban tercatat."
                                    format={formatRupiah}
                                />
                            </ReportSection>
                            <TotalRow
                                label="Total Beban"
                                current={formatRupiah(totalExpenses)}
                                previous={formatRupiah(totalExpensesLastYear)}
                                currentYear={currentYear}
                                lastYear={lastYear}
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
                            currentYear={currentYear}
                            lastYear={lastYear}
                        />
                    </div>
                </ReportDocument>
            </PageShell>
        </AppLayout>
    );
}
