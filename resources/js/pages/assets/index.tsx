import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type Asset, type BreadcrumbItem, type Journal } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Calculator, Calendar, ClipboardList, Coins, Plus, TrendingDown, Search, X, FileText } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Assets',
        href: '/assets',
    },
];

interface AssetsProps {
    assets: Asset[];
    assetJournals: Journal[];
}

const PERIODE_LABELS: Record<string, string> = {
    periode_1: 'Kelompok 1 (4 Tahun)',
    periode_2: 'Kelompok 2 (8 Tahun)',
    periode_3: 'Kelompok 3 (16 Tahun)',
    periode_4: 'Kelompok 4 (20 Tahun)',
};

interface ScheduleRow {
    bulanKe: number;
    periode: string;
    penyusutanBulanan: number;
    akumulasiPenyusutan: number;
    nilaiBuku: number;
    isTerlewati: boolean;
}

export default function Index({ assets, assetJournals = [] }: AssetsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState('all');
    const [filterTahun, setFilterTahun] = useState('all');
    const [filterBulan, setFilterBulan] = useState('all');
    const [filterTanggal, setFilterTanggal] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        nama: '',
        jenis: 'inventaris',
        harga_perolehan: '',
        nilai_residu: '',
        tanggal_perolehan: '',
        periode: 'periode_1',
    });

    const formatRupiah = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date(dateString));
    };

    // Dynamically retrieve unique years present in user's assets
    const uniqueYears = Array.from(
        new Set(
            assets
                .map((asset) => {
                    if (!asset.tanggal_perolehan) return '';
                    return new Date(asset.tanggal_perolehan).getFullYear().toString();
                })
                .filter(Boolean),
        ),
    ).sort((a, b) => b.localeCompare(a));

    // Dynamic Client-Side Filtering
    const filteredAssets = assets.filter((asset) => {
        // 1. Search name
        const matchesSearch = asset.nama.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Filter asset type
        const matchesJenis = filterJenis === 'all' ? true : asset.jenis === filterJenis;

        // 3. Date filters
        if (filterTanggal) {
            // Match exact date (ignoring year/month dropdowns)
            const assetDateStr = new Date(asset.tanggal_perolehan).toISOString().split('T')[0];
            return matchesSearch && matchesJenis && assetDateStr === filterTanggal;
        }

        let matchesYear = true;
        let matchesMonth = true;

        if (asset.tanggal_perolehan) {
            const date = new Date(asset.tanggal_perolehan);
            if (filterTahun !== 'all') {
                matchesYear = date.getFullYear().toString() === filterTahun;
            }
            if (filterBulan !== 'all') {
                const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                matchesMonth = monthStr === filterBulan;
            }
        }

        return matchesSearch && matchesJenis && matchesYear && matchesMonth;
    });

    // Summary Stats recalculated dynamically based on filtered list
    const totalAssets = filteredAssets.length;
    const totalHargaPerolehan = filteredAssets.reduce((sum, asset) => sum + parseFloat(asset.harga_perolehan as string), 0);
    const totalAkumulasiPenyusutan = filteredAssets.reduce((sum, asset) => sum + asset.akumulasi_penyusutan, 0);
    const totalNilaiBuku = filteredAssets.reduce((sum, asset) => sum + asset.nilai_buku, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('assets.store'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
        });
    };

    const handleOpenSchedule = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsScheduleOpen(true);
    };

    const generateDepreciationSchedule = (asset: Asset): ScheduleRow[] => {
        const schedule: ScheduleRow[] = [];
        const hargaPerolehan = parseFloat(asset.harga_perolehan as string);
        const nilaiResidu = parseFloat(asset.nilai_residu as string);

        const MAP_TAHUN: Record<string, number> = {
            periode_1: 4,
            periode_2: 8,
            periode_3: 16,
            periode_4: 20,
        };
        const totalTahun = MAP_TAHUN[asset.periode] || 4;
        const totalBulan = totalTahun * 12;

        const totalPenyusutan = hargaPerolehan - nilaiResidu;
        const penyusutanPerBulan = totalPenyusutan / totalBulan;

        const tglMulai = new Date(asset.tanggal_perolehan);
        const hariIni = new Date();

        let akumulasi = 0;

        for (let i = 1; i <= totalBulan; i++) {
            const tglBaris = new Date(tglMulai.getFullYear(), tglMulai.getMonth() + i - 1, 1);
            const isTerlewati = tglBaris <= new Date(hariIni.getFullYear(), hariIni.getMonth(), 1);

            let bebanBulanIni = penyusutanPerBulan;
            if (i === totalBulan) {
                bebanBulanIni = totalPenyusutan - akumulasi;
            }

            akumulasi += bebanBulanIni;
            const nilaiBuku = hargaPerolehan - akumulasi;

            const namaBulan = tglBaris.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

            schedule.push({
                bulanKe: i,
                periode: namaBulan,
                penyusutanBulanan: Math.round(bebanBulanIni),
                akumulasiPenyusutan: Math.round(akumulasi),
                nilaiBuku: Math.round(Math.max(nilaiResidu, nilaiBuku)),
                isTerlewati,
            });
        }

        return schedule;
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterJenis('all');
        setFilterTahun('all');
        setFilterBulan('all');
        setFilterTanggal('');
    };

    const isFilterActive = searchQuery || filterJenis !== 'all' || filterTahun !== 'all' || filterBulan !== 'all' || filterTanggal;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Aset & Penyusutan" />

            <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daftar Aset</h1>
                        <p className="text-muted-foreground text-sm">Kelola aset Anda dan pantau depresiasi otomatis dengan metode garis lurus.</p>
                    </div>
                    <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Aset
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-card rounded-xl border p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Total Aset</h3>
                            <ClipboardList className="text-muted-foreground h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold">{totalAssets}</div>
                        <p className="text-muted-foreground text-xs">Jumlah aset terdaftar</p>
                    </div>

                    <div className="bg-card rounded-xl border p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Total Nilai Perolehan</h3>
                            <Coins className="text-muted-foreground h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold">{formatRupiah(totalHargaPerolehan)}</div>
                        <p className="text-muted-foreground text-xs">Kapitalisasi aset awal</p>
                    </div>

                    <div className="bg-card rounded-xl border p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Akumulasi Depresiasi</h3>
                            <TrendingDown className="text-muted-foreground h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatRupiah(totalAkumulasiPenyusutan)}</div>
                        <p className="text-muted-foreground text-xs">Total nilai penyusutan berjalan</p>
                    </div>

                    <div className="bg-card rounded-xl border p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Total Nilai Buku</h3>
                            <Calculator className="text-muted-foreground h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(totalNilaiBuku)}</div>
                        <p className="text-muted-foreground text-xs">Sisa nilai ekonomis saat ini</p>
                    </div>
                </div>

                {/* Filter Controls (Placed Below Cards, Above Table) */}
                <div className="bg-card border rounded-xl p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-5 items-end">
                    {/* Searching */}
                    <div className="grid gap-1.5 flex-1 relative">
                        <Label htmlFor="search">Cari Nama Aset</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Ketik nama aset..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>

                    {/* Filter Jenis */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="jenis_filter">Jenis Aset</Label>
                        <select
                            id="jenis_filter"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                            value={filterJenis}
                            onChange={(e) => setFilterJenis(e.target.value)}
                        >
                            <option value="all">Semua Jenis</option>
                            <option value="inventaris">Inventaris</option>
                            <option value="kendaraan">Kendaraan</option>
                            <option value="gedung">Gedung</option>
                        </select>
                    </div>

                    {/* Filter Tahun */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="tahun_filter">Tahun Perolehan</Label>
                        <select
                            id="tahun_filter"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                            value={filterTahun}
                            onChange={(e) => {
                                setFilterTahun(e.target.value);
                                setFilterTanggal(''); // clear specific date to avoid filter conflicts
                            }}
                        >
                            <option value="all">Semua Tahun</option>
                            {uniqueYears.map((yr) => (
                                <option key={yr} value={yr}>
                                    {yr}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Bulan */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="bulan_filter">Bulan Perolehan</Label>
                        <select
                            id="bulan_filter"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                            value={filterBulan}
                            onChange={(e) => {
                                setFilterBulan(e.target.value);
                                setFilterTanggal(''); // clear specific date to avoid filter conflicts
                            }}
                        >
                            <option value="all">Semua Bulan</option>
                            <option value="01">Januari</option>
                            <option value="02">Februari</option>
                            <option value="03">Maret</option>
                            <option value="04">April</option>
                            <option value="05">Mei</option>
                            <option value="06">Juni</option>
                            <option value="07">Juli</option>
                            <option value="08">Agustus</option>
                            <option value="09">September</option>
                            <option value="10">Oktober</option>
                            <option value="11">November</option>
                            <option value="12">Desember</option>
                        </select>
                    </div>

                    {/* Filter Tanggal Spesifik & Reset */}
                    <div className="flex gap-2 items-end">
                        <div className="grid gap-1.5 flex-grow">
                            <Label htmlFor="tanggal_filter">Tanggal Spesifik</Label>
                            <Input
                                id="tanggal_filter"
                                type="date"
                                value={filterTanggal}
                                onChange={(e) => {
                                    setFilterTanggal(e.target.value);
                                    if (e.target.value) {
                                        setFilterTahun('all');
                                        setFilterBulan('all');
                                    }
                                }}
                                className="h-9"
                            />
                        </div>
                        {isFilterActive && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-3 flex-shrink-0"
                                onClick={handleResetFilters}
                                title="Reset Filter"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-card w-full overflow-hidden rounded-xl border shadow-xs">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[1000px] border-collapse text-left">
                            <thead>
                                <tr className="bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                    <th className="px-6 py-4">Nama Aset</th>
                                    <th className="px-6 py-4">Jenis</th>
                                    <th className="px-6 py-4">Kelompok Umur</th>
                                    <th className="px-6 py-4">Tgl Perolehan</th>
                                    <th className="px-6 py-4 text-right">Harga Perolehan</th>
                                    <th className="px-6 py-4 text-right">Nilai Residu</th>
                                    <th className="px-6 py-4 text-right">Penyusutan/Bulan</th>
                                    <th className="px-6 py-4 text-right">Akumulasi Penyusutan</th>
                                    <th className="px-6 py-4 text-right">Nilai Buku</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-muted-foreground px-6 py-12 text-center">
                                            Tidak ada aset yang cocok dengan filter atau pencarian Anda.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="text-foreground px-6 py-4 font-medium">{asset.nama}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-accent text-accent-foreground rounded-md px-2 py-1 text-xs font-semibold capitalize">
                                                    {asset.jenis}
                                                </span>
                                            </td>
                                            <td className="text-muted-foreground px-6 py-4">{PERIODE_LABELS[asset.periode]}</td>
                                            <td className="text-muted-foreground px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(asset.tanggal_perolehan)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">{formatRupiah(asset.harga_perolehan)}</td>
                                            <td className="text-muted-foreground px-6 py-4 text-right">{formatRupiah(asset.nilai_residu)}</td>
                                            <td className="text-muted-foreground px-6 py-4 text-right">{formatRupiah(asset.penyusutan_bulanan)}</td>
                                            <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400">
                                                {formatRupiah(asset.akumulasi_penyusutan)}
                                                <span className="text-muted-foreground block text-[10px]">({asset.masa_penggunaan_bulan} bulan)</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                                                {formatRupiah(asset.nilai_buku)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenSchedule(asset)}>
                                                    <Calendar className="mr-1 h-3.5 w-3.5" />
                                                    Jadwal
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Asset Journals Section */}
                <div className="flex flex-col gap-2 mt-6">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Log Jurnal Aset Terbaru</h2>
                    <p className="text-muted-foreground text-sm">Menampilkan hingga 10 transaksi perolehan dan depresiasi aset terbaru yang tercatat secara resmi di jurnal.</p>
                </div>

                {assetJournals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-card">
                        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                        <h3 className="text-base font-semibold">Belum Ada Jurnal Aset</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Jurnal akan otomatis terbentuk saat aset ditambahkan atau ketika Anda memposting penyusutan bulanan.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assetJournals.map((journal) => (
                            <div key={journal.id} className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
                                {/* Header Jurnal */}
                                <div className="flex flex-col sm:flex-row justify-between bg-muted/20 border-b p-4 gap-2">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="font-mono font-bold text-foreground text-base">
                                            {journal.nomor_jurnal}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDate(journal.tanggal)}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            journal.tipe_jurnal === 'penyusutan' 
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                            {journal.tipe_jurnal === 'penyusutan' ? 'Penyusutan Aset' : 'Perolehan Aset'}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-sm text-muted-foreground italic">
                                            {journal.keterangan}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Jurnal */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <th className="px-6 py-2.5 text-left">Akun</th>
                                                <th className="px-6 py-2.5 text-right w-1/4">Debit</th>
                                                <th className="px-6 py-2.5 text-right w-1/4">Kredit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {journal.items?.map((item) => (
                                                <tr key={item.id} className="hover:bg-muted/10">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-muted-foreground text-xs w-16">{item.coa?.kode_akun}</span>
                                                            <span className={`font-medium ${Number(item.kredit) > 0 ? 'pl-8 text-muted-foreground' : 'text-foreground'}`}>
                                                                {item.coa?.nama_akun}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono">
                                                        {Number(item.debit) > 0 ? formatRupiah(item.debit) : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono">
                                                        {Number(item.kredit) > 0 ? formatRupiah(item.kredit) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Asset Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Aset Baru</DialogTitle>
                            <DialogDescription>Masukkan rincian data aset. Perhitungan penyusutan akan dilakukan secara otomatis.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Nama */}
                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Aset</Label>
                                <Input
                                    id="nama"
                                    placeholder="Contoh: Laptop MacBook Pro"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    required
                                />
                                {errors.nama && <span className="text-xs text-red-500">{errors.nama}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Jenis */}
                                <div className="grid gap-2">
                                    <Label htmlFor="jenis">Jenis Aset</Label>
                                    <select
                                        id="jenis"
                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                        value={data.jenis}
                                        onChange={(e) => setData('jenis', e.target.value)}
                                    >
                                        <option value="inventaris">Inventaris</option>
                                        <option value="kendaraan">Kendaraan</option>
                                        <option value="gedung">Gedung</option>
                                    </select>
                                    {errors.jenis && <span className="text-xs text-red-500">{errors.jenis}</span>}
                                </div>

                                {/* Periode / Kelompok Umur */}
                                <div className="grid gap-2">
                                    <Label htmlFor="periode">Kelompok Masa Manfaat</Label>
                                    <select
                                        id="periode"
                                        className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                        value={data.periode}
                                        onChange={(e) => setData('periode', e.target.value)}
                                    >
                                        <option value="periode_1">Kelompok 1 (4 Tahun)</option>
                                        <option value="periode_2">Kelompok 2 (8 Tahun)</option>
                                        <option value="periode_3">Kelompok 3 (16 Tahun)</option>
                                        <option value="periode_4">Kelompok 4 (20 Tahun)</option>
                                    </select>
                                    {errors.periode && <span className="text-xs text-red-500">{errors.periode}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Harga Perolehan */}
                                <div className="grid gap-2">
                                    <Label htmlFor="harga_perolehan">Harga Perolehan (Rp)</Label>
                                    <Input
                                        id="harga_perolehan"
                                        type="number"
                                        placeholder="10000000"
                                        value={data.harga_perolehan}
                                        onChange={(e) => setData('harga_perolehan', e.target.value)}
                                        min="0"
                                        required
                                    />
                                    {errors.harga_perolehan && <span className="text-xs text-red-500">{errors.harga_perolehan}</span>}
                                </div>

                                {/* Nilai Residu */}
                                <div className="grid gap-2">
                                    <Label htmlFor="nilai_residu">Nilai Residu (Rp)</Label>
                                    <Input
                                        id="nilai_residu"
                                        type="number"
                                        placeholder="1000000"
                                        value={data.nilai_residu}
                                        onChange={(e) => setData('nilai_residu', e.target.value)}
                                        min="0"
                                        required
                                    />
                                    {errors.nilai_residu && <span className="text-xs text-red-500">{errors.nilai_residu}</span>}
                                </div>
                            </div>

                            {/* Tanggal Perolehan */}
                            <div className="grid gap-2">
                                <Label htmlFor="tanggal_perolehan">Tanggal Perolehan</Label>
                                <Input
                                    id="tanggal_perolehan"
                                    type="date"
                                    value={data.tanggal_perolehan}
                                    onChange={(e) => setData('tanggal_perolehan', e.target.value)}
                                    required
                                />
                                {errors.tanggal_perolehan && <span className="text-xs text-red-500">{errors.tanggal_perolehan}</span>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsOpen(false);
                                    reset();
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Simpan Aset
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Depreciation Schedule Dialog */}
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle>Jadwal Penyusutan Bulanan</DialogTitle>
                        <DialogDescription>
                            Proyeksi penyusutan bulanan untuk aset <strong>{selectedAsset?.nama}</strong> hingga masa manfaat berakhir.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAsset && (
                        <div className="mt-4 flex-1 overflow-y-auto pr-2">
                            <div className="bg-muted/30 mb-4 grid grid-cols-2 gap-4 rounded-lg border p-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">
                                        Harga Perolehan:{' '}
                                        <span className="text-foreground font-semibold">{formatRupiah(selectedAsset.harga_perolehan)}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Nilai Residu:{' '}
                                        <span className="text-foreground font-semibold">{formatRupiah(selectedAsset.nilai_residu)}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Kelompok Umur: <span className="text-foreground font-semibold">{PERIODE_LABELS[selectedAsset.periode]}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Penyusutan Bulanan:{' '}
                                        <span className="text-foreground font-semibold">{formatRupiah(selectedAsset.penyusutan_bulanan)}</span>
                                    </p>
                                </div>
                            </div>

                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-muted/40 text-muted-foreground bg-card sticky top-0 z-10 border-b text-xs font-semibold tracking-wider uppercase">
                                        <th className="px-4 py-2 text-center">Bulan Ke</th>
                                        <th className="px-4 py-2">Periode</th>
                                        <th className="px-4 py-2 text-right">Penyusutan</th>
                                        <th className="px-4 py-2 text-right">Akumulasi</th>
                                        <th className="px-4 py-2 text-right">Nilai Buku</th>
                                        <th className="px-4 py-2 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-xs">
                                    {generateDepreciationSchedule(selectedAsset).map((row) => (
                                        <tr
                                            key={row.bulanKe}
                                            className={`hover:bg-muted/20 transition-colors ${row.isTerlewati ? 'bg-muted/10 text-muted-foreground font-normal' : ''}`}
                                        >
                                            <td className="px-4 py-2 text-center font-medium">{row.bulanKe}</td>
                                            <td className="px-4 py-2 font-medium">{row.periode}</td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(row.penyusutanBulanan)}</td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(row.akumulasiPenyusutan)}</td>
                                            <td className="text-foreground px-4 py-2 text-right font-semibold">{formatRupiah(row.nilaiBuku)}</td>
                                            <td className="px-4 py-2 text-center">
                                                {row.isTerlewati ? (
                                                    <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                                                        Terlewati
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                        Proyeksi
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <DialogFooter className="mt-4 border-t pt-4">
                        <Button onClick={() => setIsScheduleOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
