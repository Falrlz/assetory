import { Field, PageShell } from '@/components/page-header';
import {
    formatDateRange,
    formatDateSlash,
    ReportDocument,
    ReportFilterCard,
    ReportSection,
    ReportSignatures,
    ReportToolbar,
} from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { controlBaseClass } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableEmpty, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Catatan Keuangan (CALK)',
        href: '/reports/calk',
    },
];

interface AssetDetail {
    id: number;
    nama_aset: string;
    tanggal_perolehan: string;
    periode: '4_tahun' | '8_tahun' | '16_tahun' | '20_tahun';
    harga_perolehan: number;
    akumulasi_penyusutan: number;
    nilai_buku: number;
    sisa_bulan: number;
}

interface CashDetail {
    kode_akun: string;
    nama_akun: string;
    saldo: number;
}

interface CalkProps {
    assets: AssetDetail[];
    cashItems: CashDetail[];
    calkNotes: string | null;
    filters: {
        start_date: string;
        end_date: string;
    };
}

const DEFAULT_NOTES = [
    'Kebijakan Akuntansi:',
    '1. Pengakuan Aset Tetap: Aset tetap dinyatakan berdasarkan harga perolehan dikurangi akumulasi penyusutan.',
    '2. Metode Penyusutan: Penyusutan aset tetap dihitung menggunakan metode Garis Lurus (Straight-Line Method) untuk mengalokasikan harga perolehan aset tetap hingga mencapai nilai residu selama estimasi masa manfaat ekonomisnya.',
    '3. Kas dan Setara Kas: Kas dan setara kas mencakup kas tunai serta saldo rekening bank yang tidak dibatasi penggunaannya.',
].join('\n');

export default function Calk({ assets, cashItems, calkNotes, filters }: CalkProps) {
    const { errors } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [localError, setLocalError] = useState<string | null>(null);

    const [notes, setNotes] = useState(calkNotes || DEFAULT_NOTES);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (calkNotes) {
            setNotes(calkNotes);
        }
    }, [calkNotes]);

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
            route('reports.calk'),
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
        router.get(route('reports.calk'), {
            start_date: start,
            end_date: end,
        });
    };

    const handleSaveNotes = () => {
        setIsSaving(true);
        router.post(
            route('reports.calk.update'),
            { calk_notes: notes },
            {
                onSuccess: () => {
                    setIsSaving(false);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                },
                onError: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    const translatePeriode = (p: string) => p.replace('_', ' ');

    const totalAssetsPerolehan = assets.reduce((sum, item) => sum + item.harga_perolehan, 0);
    const totalAssetsAkm = assets.reduce((sum, item) => sum + item.akumulasi_penyusutan, 0);
    const totalAssetsBuku = assets.reduce((sum, item) => sum + item.nilai_buku, 0);

    const totalCash = cashItems.reduce((sum, item) => sum + item.saldo, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catatan Keuangan (CALK)" />

            <PageShell className="print:p-0">
                <ReportToolbar
                    title="Catatan Atas Laporan Keuangan (CALK)"
                    description="Merinci akun penting seperti kas dan rincian mutasi nilai buku aset tetap."
                />

                {(errors.start_date || errors.end_date || localError) && (
                    <Alert variant="destructive" className="print:hidden">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Kesalahan Validasi</AlertTitle>
                        <AlertDescription>{errors.start_date || errors.end_date || localError}</AlertDescription>
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
                    className="space-y-8"
                    title="Catatan Atas Laporan Keuangan"
                    period={`Periode ${formatDateRange(filters.start_date, filters.end_date)}`}
                >
                    {/* Section 1: Narrative Notes */}
                    <ReportSection title="1. Ikhtisar Kebijakan Akuntansi & Catatan Umum">
                        {/* Editor (hidden on print) */}
                        <div className="space-y-3 print:hidden">
                            <textarea
                                id="calk_notes"
                                aria-label="Catatan kebijakan akuntansi"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={6}
                                className={cn(controlBaseClass, 'min-h-32 resize-y px-3 py-2 text-sm leading-relaxed')}
                                placeholder="Tulis kebijakan akuntansi di sini..."
                            />
                            <div className="flex items-center justify-end gap-3">
                                {saveSuccess && (
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Catatan berhasil disimpan.</span>
                                )}
                                <Button size="sm" onClick={handleSaveNotes} disabled={isSaving}>
                                    <Save />
                                    Simpan Catatan
                                </Button>
                            </div>
                        </div>

                        {/* Readable text (print only) */}
                        <p className="hidden text-sm leading-relaxed whitespace-pre-line print:block">{notes}</p>
                    </ReportSection>

                    {/* Section 2: Cash breakdown */}
                    <ReportSection
                        title="2. Rincian Kas dan Setara Kas"
                        description={`Rincian saldo rekening kas tunai dan rekening bank per tanggal ${formatDateSlash(endDate)}.`}
                    >
                        <Table minWidth="min-w-[480px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="min-w-[240px]">Kode &amp; Nama Rekening</TableHead>
                                    <TableHead align="right" className="w-52">
                                        Saldo
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashItems.length === 0 ? (
                                    <TableEmpty colSpan={2} className="py-8" description="Tidak ada saldo kas berjalan pada periode ini." />
                                ) : (
                                    cashItems.map((item) => (
                                        <TableRow key={item.kode_akun}>
                                            <TableCell>
                                                <span className="text-foreground block font-medium">{item.nama_akun}</span>
                                                <span className="text-muted-foreground block font-mono text-xs">{item.kode_akun}</span>
                                            </TableCell>
                                            <TableCell numeric className="text-foreground font-semibold">
                                                {formatRupiah(item.saldo)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="hover:bg-transparent">
                                    <TableCell>Total Kas &amp; Setara Kas</TableCell>
                                    <TableCell numeric className="text-base">
                                        {formatRupiah(totalCash)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </ReportSection>

                    {/* Section 3: Fixed Assets mutation schedule */}
                    <ReportSection
                        title="3. Rincian Aset Tetap dan Akumulasi Penyusutan"
                        description="Rincian perolehan, akumulasi penyusutan, dan estimasi sisa masa manfaat ekonomis aset tetap perusahaan."
                    >
                        <Table minWidth="min-w-[900px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="min-w-[200px]">Aset Tetap</TableHead>
                                    <TableHead className="w-36">Masa Manfaat</TableHead>
                                    <TableHead align="right" className="w-32">
                                        Sisa Umur
                                    </TableHead>
                                    <TableHead align="right" className="w-44">
                                        Harga Perolehan
                                    </TableHead>
                                    <TableHead align="right" className="w-44">
                                        Akm. Penyusutan
                                    </TableHead>
                                    <TableHead align="right" className="w-44">
                                        Nilai Sisa Buku
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.length === 0 ? (
                                    <TableEmpty colSpan={6} className="py-8" description="Tidak ada aset tetap terdaftar pada periode ini." />
                                ) : (
                                    assets.map((asset) => (
                                        <TableRow key={asset.id}>
                                            <TableCell>
                                                <span className="text-foreground block font-medium">{asset.nama_aset}</span>
                                                <span className="text-muted-foreground block text-xs">
                                                    Perolehan {formatDateSlash(asset.tanggal_perolehan)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground capitalize">{translatePeriode(asset.periode)}</TableCell>
                                            <TableCell numeric className="text-foreground">
                                                {asset.sisa_bulan} bln
                                            </TableCell>
                                            <TableCell numeric className="text-foreground">
                                                {formatRupiah(asset.harga_perolehan)}
                                            </TableCell>
                                            <TableCell numeric className="text-rose-600 dark:text-rose-400">
                                                −{formatRupiah(asset.akumulasi_penyusutan)}
                                            </TableCell>
                                            <TableCell numeric className="text-foreground font-semibold">
                                                {formatRupiah(asset.nilai_buku)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={3}>Total Aset Tetap</TableCell>
                                    <TableCell numeric>{formatRupiah(totalAssetsPerolehan)}</TableCell>
                                    <TableCell numeric className="text-rose-600 dark:text-rose-400">
                                        −{formatRupiah(totalAssetsAkm)}
                                    </TableCell>
                                    <TableCell numeric>{formatRupiah(totalAssetsBuku)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </ReportSection>

                    <ReportSignatures />
                </ReportDocument>
            </PageShell>
        </AppLayout>
    );
}
