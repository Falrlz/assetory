import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Asset } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Coins, TrendingDown, ClipboardList, Calculator, Calendar } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Assets',
        href: '/assets',
    },
];

interface AssetsProps {
    assets: Asset[];
}

const PERIODE_LABELS: Record<string, string> = {
    periode_1: 'Kelompok 1 (4 Tahun)',
    periode_2: 'Kelompok 2 (8 Tahun)',
    periode_3: 'Kelompok 3 (16 Tahun)',
    periode_4: 'Kelompok 4 (20 Tahun)',
};

export default function Index({ assets }: AssetsProps) {
    const [isOpen, setIsOpen] = useState(false);

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

    // Calculate Summary Stats
    const totalAssets = assets.length;
    const totalHargaPerolehan = assets.reduce((sum, asset) => sum + parseFloat(asset.harga_perolehan as string), 0);
    const totalAkumulasiPenyusutan = assets.reduce((sum, asset) => sum + asset.akumulasi_penyusutan, 0);
    const totalNilaiBuku = assets.reduce((sum, asset) => sum + asset.nilai_buku, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('assets.store'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Aset & Penyusutan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daftar Aset</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola aset Anda dan pantau depresiasi otomatis dengan metode garis lurus.
                        </p>
                    </div>
                    <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Aset
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Total Aset</h3>
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{totalAssets}</div>
                        <p className="text-xs text-muted-foreground">Jumlah aset terdaftar</p>
                    </div>

                    <div className="rounded-xl border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Total Nilai Perolehan</h3>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{formatRupiah(totalHargaPerolehan)}</div>
                        <p className="text-xs text-muted-foreground">Kapitalisasi aset awal</p>
                    </div>

                    <div className="rounded-xl border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Total Akumulasi Depresiasi</h3>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {formatRupiah(totalAkumulasiPenyusutan)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total nilai penyusutan berjalan</p>
                    </div>

                    <div className="rounded-xl border bg-card p-6 shadow-xs">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Total Nilai Buku</h3>
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatRupiah(totalNilaiBuku)}
                        </div>
                        <p className="text-xs text-muted-foreground">Sisa nilai ekonomis saat ini</p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <th className="px-6 py-4">Nama Aset</th>
                                    <th className="px-6 py-4">Jenis</th>
                                    <th className="px-6 py-4">Kelompok Umur</th>
                                    <th className="px-6 py-4">Tgl Perolehan</th>
                                    <th className="px-6 py-4 text-right">Harga Perolehan</th>
                                    <th className="px-6 py-4 text-right">Nilai Residu</th>
                                    <th className="px-6 py-4 text-right">Penyusutan/Bulan</th>
                                    <th className="px-6 py-4 text-right">Akumulasi Penyusutan</th>
                                    <th className="px-6 py-4 text-right">Nilai Buku</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                                            Belum ada data aset. Silakan klik "Tambah Aset" untuk memulai.
                                        </td>
                                    </tr>
                                ) : (
                                    assets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{asset.nama}</td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2 py-1 text-xs rounded-md bg-accent text-accent-foreground font-semibold">
                                                    {asset.jenis}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {PERIODE_LABELS[asset.periode]}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(asset.tanggal_perolehan)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatRupiah(asset.harga_perolehan)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground">
                                                {formatRupiah(asset.nilai_residu)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground">
                                                {formatRupiah(asset.penyusutan_bulanan)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-red-600 dark:text-red-400 font-medium">
                                                {formatRupiah(asset.akumulasi_penyusutan)}
                                                <span className="block text-[10px] text-muted-foreground">
                                                    ({asset.masa_penggunaan_bulan} bulan)
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-semibold">
                                                {formatRupiah(asset.nilai_buku)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Asset Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Aset Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan rincian data aset. Perhitungan penyusutan akan dilakukan secara otomatis.
                            </DialogDescription>
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
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
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
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
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
                                    {errors.harga_perolehan && (
                                        <span className="text-xs text-red-500">{errors.harga_perolehan}</span>
                                    )}
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
                                    {errors.nilai_residu && (
                                        <span className="text-xs text-red-500">{errors.nilai_residu}</span>
                                    )}
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
                                {errors.tanggal_perolehan && (
                                    <span className="text-xs text-red-500">{errors.tanggal_perolehan}</span>
                                )}
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
        </AppLayout>
    );
}
