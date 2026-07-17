import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, FileText, Printer, RotateCcw, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

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

export default function Calk({ assets, cashItems, calkNotes, filters }: CalkProps) {
    const { errors } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [localError, setLocalError] = useState<string | null>(null);

    const defaultNotes = calkNotes || 
        "Kebijakan Akuntansi:\n" +
        "1. Pengakuan Aset Tetap: Aset tetap dinyatakan berdasarkan harga perolehan dikurangi akumulasi penyusutan.\n" +
        "2. Metode Penyusutan: Penyusutan aset tetap dihitung menggunakan metode Garis Lurus (Straight-Line Method) untuk mengalokasikan harga perolehan aset tetap hingga mencapai nilai residu selama estimasi masa manfaat ekonomisnya.\n" +
        "3. Kas dan Setara Kas: Kas dan setara kas mencakup kas tunai serta saldo rekening bank yang tidak dibatasi penggunaannya.";

    const [notes, setNotes] = useState(defaultNotes);
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
        const end = `${currentYear}-12-31`;
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
            }
        );
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

    const formatAcquisitionDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const translatePeriode = (p: string) => {
        return p.replace('_', ' ');
    };

    const totalAssetsPerolehan = assets.sum ? (assets as any).sum('harga_perolehan') : assets.reduce((sum, item) => sum + item.harga_perolehan, 0);
    const totalAssetsAkm = assets.reduce((sum, item) => sum + item.akumulasi_penyusutan, 0);
    const totalAssetsBuku = assets.reduce((sum, item) => sum + item.nilai_buku, 0);

    const totalCash = cashItems.reduce((sum, item) => sum + item.saldo, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catatan Keuangan (CALK)" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 print:p-0">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Catatan Atas Laporan Keuangan (CALK)</h1>
                        <p className="text-sm text-neutral-500">
                            Merinci rincian akun penting seperti kas dan rincian mutasi nilai buku aset tetap.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak Laporan
                        </Button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="rounded-xl border bg-card p-4 shadow-sm print:hidden">
                    <form onSubmit={handleFilter} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="grid flex-1 gap-1.5">
                            <label htmlFor="start_date" className="text-xs font-semibold text-neutral-500 uppercase">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                id="start_date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                            />
                        </div>
                        <div className="grid flex-1 gap-1.5">
                            <label htmlFor="end_date" className="text-xs font-semibold text-neutral-500 uppercase">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                id="end_date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="h-9">
                                Filter
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="h-9">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </form>

                    {(errors.start_date || errors.end_date || localError) && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Kesalahan Validasi</AlertTitle>
                            <AlertDescription>
                                {errors.start_date || errors.end_date || localError}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Main Content Card */}
                <div className="flex-1 space-y-8 rounded-2xl border bg-card p-8 shadow-sm print:border-none print:p-0 print:shadow-none">
                    {/* Document Header */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground">Assetory Company</h2>
                        <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">Catatan Atas Laporan Keuangan</h3>
                        <p className="text-sm text-neutral-500 mt-1">Periode: {formatDateRange(filters.start_date, filters.end_date)}</p>
                    </div>

                    {/* Section 1: Narrative Notes */}
                    <div className="space-y-3">
                        <h4 className="flex items-center text-base font-bold text-foreground border-b pb-2">
                            <FileText className="mr-2 h-4 w-4 text-neutral-500" />
                            1. Ikhtisar Kebijakan Akuntansi & Catatan Umum
                        </h4>
                        
                        {/* Editor (hidden on print) */}
                        <div className="space-y-3 print:hidden">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={6}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Tulis kebijakan akuntansi di sini..."
                            />
                            <div className="flex items-center gap-2 justify-end">
                                {saveSuccess && <span className="text-xs text-emerald-600 font-medium">Catatan berhasil disimpan!</span>}
                                <Button size="sm" onClick={handleSaveNotes} disabled={isSaving}>
                                    <Save className="mr-1.5 h-3.5 w-3.5" />
                                    Simpan Catatan
                                </Button>
                            </div>
                        </div>

                        {/* Readable Text (visible on print, fallback for screen reader) */}
                        <div className="hidden print:block whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-900/30 p-4 rounded-xl border">
                            {notes}
                        </div>
                    </div>

                    {/* Section 2: Cash breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-base font-bold text-foreground border-b pb-2">
                            2. Rincian Kas dan Setara Kas
                        </h4>
                        <p className="text-xs text-neutral-500">
                            Berikut adalah rincian saldo rekening kas tunai dan rekening bank per tanggal {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}:
                        </p>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b bg-neutral-50 dark:bg-neutral-900/30">
                                    <th className="px-4 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-400">Kode & Nama Rekening</th>
                                    <th className="px-4 py-2 text-right font-semibold text-neutral-600 dark:text-neutral-400">Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cashItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-4 text-center text-neutral-500">
                                            Tidak ada saldo kas berjalan pada periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    cashItems.map((item) => (
                                        <tr key={item.kode_akun} className="border-b hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10">
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-foreground">{item.nama_akun}</div>
                                                <div className="text-xs text-neutral-500 font-mono">{item.kode_akun}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-foreground font-mono">
                                                {formatRupiah(item.saldo)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                <tr className="bg-neutral-50/30 dark:bg-neutral-900/20 font-bold border-t-2">
                                    <td className="px-4 py-3 text-foreground">Total Kas & Setara Kas</td>
                                    <td className="px-4 py-3 text-right text-foreground font-mono text-base">
                                        {formatRupiah(totalCash)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Section 3: Fixed Assets mutation schedule */}
                    <div className="space-y-3">
                        <h4 className="text-base font-bold text-foreground border-b pb-2">
                            3. Rincian Aset Tetap dan Akumulasi Penyusutan
                        </h4>
                        <p className="text-xs text-neutral-500">
                            Rincian detail perolehan, akumulasi penyusutan, dan estimasi sisa masa manfaat ekonomis aset tetap perusahaan:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b bg-neutral-50 dark:bg-neutral-900/30">
                                        <th className="px-3 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-400">Aset Tetap</th>
                                        <th className="px-3 py-2 text-left font-semibold text-neutral-600 dark:text-neutral-400">Masa Manfaat</th>
                                        <th className="px-3 py-2 text-right font-semibold text-neutral-600 dark:text-neutral-400">Sisa Umur</th>
                                        <th className="px-3 py-2 text-right font-semibold text-neutral-600 dark:text-neutral-400">Harga Perolehan</th>
                                        <th className="px-3 py-2 text-right font-semibold text-neutral-600 dark:text-neutral-400">Akm. Penyusutan</th>
                                        <th className="px-3 py-2 text-right font-semibold text-neutral-600 dark:text-neutral-400">Nilai Sisa Buku</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">
                                                Tidak ada aset tetap terdaftar pada periode ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map((asset) => (
                                            <tr key={asset.id} className="border-b hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10">
                                                <td className="px-3 py-2.5">
                                                    <div className="font-semibold text-foreground">{asset.nama_aset}</div>
                                                    <div className="text-[10px] text-neutral-500">Perolehan: {formatAcquisitionDate(asset.tanggal_perolehan)}</div>
                                                </td>
                                                <td className="px-3 py-2.5 text-foreground capitalize">
                                                    {translatePeriode(asset.periode)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-medium text-foreground">
                                                    {asset.sisa_bulan} Bulan
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono text-foreground">
                                                    {formatRupiah(asset.harga_perolehan)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono text-red-600 dark:text-red-400">
                                                    -{formatRupiah(asset.akumulasi_penyusutan)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-foreground font-mono">
                                                    {formatRupiah(asset.nilai_buku)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    <tr className="bg-neutral-50/30 dark:bg-neutral-900/20 font-bold border-t-2">
                                        <td colSpan={3} className="px-3 py-3 text-foreground text-sm">Total Aset Tetap</td>
                                        <td className="px-3 py-3 text-right font-mono text-foreground">{formatRupiah(totalAssetsPerolehan)}</td>
                                        <td className="px-3 py-3 text-right font-mono text-red-600 dark:text-red-400">-{formatRupiah(totalAssetsAkm)}</td>
                                        <td className="px-3 py-3 text-right font-mono text-foreground text-sm">{formatRupiah(totalAssetsBuku)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
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
