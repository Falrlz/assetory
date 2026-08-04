import { Field, PageShell } from '@/components/page-header';
import {
    formatDateSlash,
    ReportDocument,
    ReportFilterCard,
    ReportSection,
    ReportSignatures,
    ReportToolbar,
} from '@/components/reports/report-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
    hasAppliedFilter?: boolean;
    filters: {
        year?: string;
        start_date?: string;
        end_date?: string;
    };
}

const DEFAULT_NOTES = [
    'Kebijakan Akuntansi:',
    '1. Pengakuan Aset Tetap: Aset tetap dinyatakan berdasarkan harga perolehan dikurangi akumulasi penyusutan.',
    '2. Metode Penyusutan: Penyusutan aset tetap dihitung menggunakan metode Garis Lurus (Straight-Line Method) untuk mengalokasikan harga perolehan aset tetap hingga mencapai nilai residu selama estimasi masa manfaat ekonomisnya.',
    '3. Kas dan Setara Kas: Kas dan setara kas mencakup kas tunai serta saldo rekening bank yang tidak dibatasi penggunaannya.',
].join('\n');

export default function Calk({ assets = [], cashItems = [], calkNotes, hasAppliedFilter = false, filters }: CalkProps) {
    const { errors } = usePage().props;
    const [selectedYear, setSelectedYear] = useState<string>(filters?.year || '');
    const [localError, setLocalError] = useState<string | null>(null);

    const [notes, setNotes] = useState(calkNotes || DEFAULT_NOTES);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const currentCalendarYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 7 }, (_, i) => (currentCalendarYear - 5 + i).toString());

    const endDate = filters?.end_date || (selectedYear ? `${selectedYear}-12-31` : `${currentCalendarYear}-12-31`);

    useEffect(() => {
        if (calkNotes) {
            setNotes(calkNotes);
        }
    }, [calkNotes]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedYear) {
            setLocalError('Silakan pilih Tahun Buku laporan terlebih dahulu.');
            return;
        }

        setLocalError(null);
        router.get(
            route('reports.calk'),
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
        router.get(route('reports.calk'), {});
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

    const formatRupiah = (value: number | string) => {
        const num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const translatePeriode = (p: string) => (p ? p.replace('_', ' ') : '');

    const totalAssetsPerolehan = (assets || []).reduce((sum, item) => sum + (Number(item.harga_perolehan) || 0), 0);
    const totalAssetsAkm = (assets || []).reduce((sum, item) => sum + (Number(item.akumulasi_penyusutan) || 0), 0);
    const totalAssetsBuku = (assets || []).reduce((sum, item) => sum + (Number(item.nilai_buku) || 0), 0);

    const totalCash = (cashItems || []).reduce((sum, item) => sum + (item.saldo || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catatan Atas Laporan Keuangan (CALK)" />

            <PageShell className="print:p-0">
                <ReportToolbar
                    title="Catatan Atas Laporan Keuangan (CALK)"
                    description="Rincian penjelasan dan sanksi kebijakan akuntansi serta jadwal aset tetap dan kas pada satu Tahun Buku."
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
                            <span className="font-semibold">"Tampilkan Laporan"</span> untuk memuat CALK.
                        </p>
                    </div>
                ) : (
                    <ReportDocument
                        className="mx-auto w-full max-w-4xl print:max-w-none"
                        title="Catatan Atas Laporan Keuangan"
                        period={`Tahun Buku ${selectedYear} (1 Jan ${selectedYear} - 31 Des ${selectedYear})`}
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
                                                    <span className="text-foreground block font-medium">{asset.nama_aset || asset.nama}</span>
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
                )}
            </PageShell>
        </AppLayout>
    );
}
