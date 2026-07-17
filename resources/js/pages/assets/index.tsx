import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type Asset, type BreadcrumbItem, type Coa, type Journal } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Calculator, Calendar, ClipboardList, Coins, FileText, Plus, Search, TrendingDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Assets',
        href: '/assets',
    },
];

interface AssetsProps {
    assets: Asset[];
    assetJournals: Journal[];
    coas: Coa[];
}

const PERIODE_LABELS: Record<string, string> = {
    periode_1: 'Kelompok 1 (4 Tahun)',
    periode_2: 'Kelompok 2 (8 Tahun)',
    periode_3: 'Kelompok 3 (16 Tahun)',
    periode_4: 'Kelompok 4 (20 Tahun)',
};

const PERIODE_BULAN: Record<string, number> = {
    periode_1: 48,
    periode_2: 96,
    periode_3: 192,
    periode_4: 240,
};

interface ScheduleRow {
    bulanKe: number;
    periode: string;
    penyusutanBulanan: number;
    akumulasiPenyusutan: number;
    nilaiBuku: number;
    isTerlewati: boolean;
}

export default function Index({ assets, assetJournals = [], coas = [] }: AssetsProps) {
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
        nilai_residu: '1',
        tanggal_perolehan: new Date().toISOString().split('T')[0],
        periode: 'periode_1',
        coa_debit_id: '',
        coa_kredit_id: '',
    });

    // Auto-select Debit & Kredit based on jenis
    useEffect(() => {
        if (!isOpen) return;

        const debitCoa = transactionCoas.find((coa) => {
            if (coa.kode_akun.startsWith('01.3000.01')) {
                if (data.jenis === 'inventaris' && (coa.kode_akun === '01.3000.01.04' || coa.nama_akun.toLowerCase().includes('peralatan') || coa.nama_akun.toLowerCase().includes('inventaris'))) {
                    return true;
                }
                if (data.jenis === 'kendaraan' && (coa.kode_akun === '01.3000.01.03' || coa.nama_akun.toLowerCase().includes('kendaraan'))) {
                    return true;
                }
                if (data.jenis === 'gedung' && (coa.kode_akun === '01.3000.01.02' || coa.nama_akun.toLowerCase().includes('gedung') || coa.nama_akun.toLowerCase().includes('bangunan'))) {
                    return true;
                }
            }
            return false;
        });

        setData((d) => {
            const nextData = { ...d };
            if (debitCoa) {
                nextData.coa_debit_id = debitCoa.id.toString();
            }
            // Only set default Kredit if not already selected
            if (!nextData.coa_kredit_id) {
                const defaultKreditCode = '01.1000.01.02';
                let kreditCoa = transactionCoas.find(c => c.kode_akun === defaultKreditCode);
                if (!kreditCoa) {
                    kreditCoa = transactionCoas.find(c => c.kode_akun.startsWith('01.1000.'));
                }
                if (kreditCoa) {
                    nextData.coa_kredit_id = kreditCoa.id.toString();
                }
            }
            return nextData;
        });
    }, [data.jenis, isOpen]);

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
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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

    // Split coas into Parent and Transaction (Child) accounts
    const parentCoas = coas.filter((c) => c.kode_akun.split('.').length < 4);
    const transactionCoas = coas.filter((c) => c.kode_akun.split('.').length === 4);

    // Filter Debit COAs based on selected Asset Type
    const displayDebitCoas = transactionCoas.filter((coa) => {
        if (coa.kode_akun.startsWith('01.3000.01')) {
            if (data.jenis === 'inventaris' && (coa.kode_akun === '01.3000.01.04' || coa.nama_akun.toLowerCase().includes('peralatan') || coa.nama_akun.toLowerCase().includes('inventaris'))) {
                return true;
            }
            if (data.jenis === 'kendaraan' && (coa.kode_akun === '01.3000.01.03' || coa.nama_akun.toLowerCase().includes('kendaraan'))) {
                return true;
            }
            if (data.jenis === 'gedung' && (coa.kode_akun === '01.3000.01.02' || coa.nama_akun.toLowerCase().includes('gedung') || coa.nama_akun.toLowerCase().includes('bangunan'))) {
                return true;
            }
        }
        return false;
    });

    // Filter Kredit COAs: Only Kas & Setara Kas (01.1000.*) and Utang Lancar (02.1000.*)
    const displayCreditCoas = transactionCoas.filter((coa) => {
        return coa.kode_akun.startsWith('01.1000.') || coa.kode_akun.startsWith('02.1000.');
    });

    const groupCoasByParent = (coasList: Coa[]) => {
        const groups: Record<string, Coa[]> = {};
        coasList.forEach((coa) => {
            const parts = coa.kode_akun.split('.');
            let parentLabel = 'Lainnya';
            if (parts.length >= 3) {
                // Use Level 3 parent (e.g. 01.1000.01) as group label
                const prefix3 = parts.slice(0, 3).join('.');
                const parent3 = parentCoas.find((p) => p.kode_akun === prefix3);
                if (parent3) {
                    parentLabel = parent3.nama_akun;
                } else {
                    // Fallback to Level 2 prefix
                    const prefix2 = parts.slice(0, 2).join('.');
                    const parent2 = parentCoas.find((p) => p.kode_akun === prefix2);
                    parentLabel = parent2 ? parent2.nama_akun : prefix3;
                }
            }
            if (!groups[parentLabel]) {
                groups[parentLabel] = [];
            }
            groups[parentLabel].push(coa);
        });
        return groups;
    };

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
                <div className="bg-card grid grid-cols-1 items-end gap-4 rounded-xl border p-4 sm:grid-cols-2 md:grid-cols-5">
                    {/* Searching */}
                    <div className="relative grid flex-1 gap-1.5">
                        <Label htmlFor="search">Cari Nama Aset</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                            <Input
                                id="search"
                                placeholder="Ketik nama aset..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-9"
                            />
                        </div>
                    </div>

                    {/* Filter Jenis */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="jenis_filter">Jenis Aset</Label>
                        <select
                            id="jenis_filter"
                            className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
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
                            className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
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
                            className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus:ring-2 focus:outline-hidden"
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
                    <div className="flex items-end gap-2">
                        <div className="grid flex-grow gap-1.5">
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
                                className="h-9 flex-shrink-0 px-3"
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
                                    <th className="px-6 py-4 text-center">Umur (Bulan)</th>
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
                                        <td colSpan={11} className="text-muted-foreground px-6 py-12 text-center">
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
                                            <td className="text-foreground px-6 py-4 text-center font-mono">{PERIODE_BULAN[asset.periode]} Bulan</td>
                                            <td className="px-6 py-4 text-right font-medium">{formatRupiah(asset.harga_perolehan)}</td>
                                            <td className="text-muted-foreground px-6 py-4 text-right">{formatRupiah(asset.nilai_residu)}</td>
                                            <td className="text-muted-foreground px-6 py-4 text-right">{formatRupiah(asset.penyusutan_bulanan)}</td>
                                            <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400">
                                                {formatRupiah(asset.akumulasi_penyusutan)}
                                                <span className="text-muted-foreground block text-[10px]">
                                                    ({asset.masa_penggunaan_bulan} bulan berjalan)
                                                </span>
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
                <div className="mt-6 flex flex-col gap-2">
                    <h2 className="text-foreground text-xl font-bold tracking-tight">Jurnal Terbentuk</h2>
                    <p className="text-muted-foreground text-sm">
                        Menampilkan hingga 10 transaksi perolehan dan depresiasi aset terbaru yang tercatat secara resmi di jurnal.
                    </p>
                </div>

                {assetJournals.length === 0 ? (
                    <div className="bg-card flex flex-col items-center justify-center rounded-xl border py-12 text-center">
                        <FileText className="text-muted-foreground/40 mb-3 h-10 w-10" />
                        <h3 className="text-base font-semibold">Belum Ada Jurnal Aset</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                            Jurnal akan otomatis terbentuk saat aset ditambahkan atau ketika Anda memposting penyusutan bulanan.
                        </p>
                    </div>
                ) : (
                    <div className="bg-card w-full overflow-hidden rounded-xl border shadow-xs">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                        <th className="w-[120px] px-6 py-3">Tanggal</th>
                                        <th className="w-[160px] px-6 py-3">No. Referensi</th>
                                        <th className="px-6 py-3">Keterangan</th>
                                        <th className="w-[110px] px-6 py-3 text-center">No Arus Kas</th>
                                        <th className="w-[120px] px-6 py-3">Kode Akun</th>
                                        <th className="px-6 py-3">Nama Akun</th>
                                        <th className="w-[140px] px-6 py-3 text-right">Debit</th>
                                        <th className="w-[140px] px-6 py-3 text-right">Kredit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {assetJournals.flatMap((journal) =>
                                        journal.items.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                {index === 0 ? (
                                                    <>
                                                        <td
                                                            className="text-muted-foreground px-6 py-4 align-top font-medium"
                                                            rowSpan={journal.items.length}
                                                        >
                                                            {formatDate(journal.tanggal)}
                                                        </td>
                                                        <td className="px-6 py-4 align-top" rowSpan={journal.items.length}>
                                                            <span className="text-foreground mb-1 block font-mono font-bold">
                                                                {journal.nomor_jurnal}
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                                                    journal.tipe_jurnal === 'penyusutan'
                                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                                }`}
                                                            >
                                                                {journal.tipe_jurnal === 'penyusutan' ? 'Penyusutan' : 'Perolehan'}
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="text-muted-foreground max-w-[200px] px-6 py-4 align-top text-xs break-words"
                                                            rowSpan={journal.items.length}
                                                        >
                                                            {journal.keterangan}
                                                        </td>
                                                    </>
                                                ) : null}
                                                <td className="text-foreground px-6 py-3 text-center font-mono text-xs">
                                                    {journal.kode_arus_kas || '-'}
                                                </td>
                                                <td className="text-muted-foreground px-6 py-3 font-mono text-xs">{item.coa?.kode_akun}</td>
                                                <td
                                                    className={`px-6 py-3 font-medium ${Number(item.kredit) > 0 ? 'text-muted-foreground pl-6' : 'text-foreground'}`}
                                                >
                                                    {item.coa?.nama_akun}
                                                </td>
                                                <td className="text-foreground px-6 py-3 text-right font-mono font-medium">
                                                    {Number(item.debit) > 0 ? formatRupiah(item.debit) : '-'}
                                                </td>
                                                <td className="text-foreground px-6 py-3 text-right font-mono font-medium">
                                                    {Number(item.kredit) > 0 ? formatRupiah(item.kredit) : '-'}
                                                </td>
                                            </tr>
                                        )),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Asset Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px]">
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Jenis */}
                                <div className="grid gap-2">
                                    <Label htmlFor="jenis">Jenis Aset</Label>
                                    <select
                                        id="jenis"
                                        className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
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
                                        className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Tanggal Perolehan */}
                                <div className="grid gap-2">
                                    <Label htmlFor="tanggal_perolehan">Tanggal Perolehan</Label>
                                    <DatePicker
                                        id="tanggal_perolehan"
                                        value={data.tanggal_perolehan}
                                        onChange={(val) => setData('tanggal_perolehan', val)}
                                        className="w-full"
                                    />
                                    {errors.tanggal_perolehan && <span className="text-xs text-red-500">{errors.tanggal_perolehan}</span>}
                                </div>

                                {/* Harga Perolehan */}
                                <div className="grid gap-2">
                                    <Label htmlFor="harga_perolehan">Harga Perolehan (Rp)</Label>
                                    <Input
                                        id="harga_perolehan"
                                        type="number"
                                        placeholder="Contoh: 10000000"
                                        value={data.harga_perolehan}
                                        onChange={(e) => setData('harga_perolehan', e.target.value)}
                                        min="0"
                                        required
                                    />
                                    {errors.harga_perolehan && <span className="text-xs text-red-500">{errors.harga_perolehan}</span>}
                                </div>
                            </div>

                            <div className="border-t my-2 pt-4">
                                <span className="text-sm font-semibold text-foreground block mb-3">Pengaturan Akuntansi & Jurnal</span>
                                
                                <div className="space-y-4">
                                    {/* Akun Aset Tetap (Debit) */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="coa_debit_id">Akun Debit — Aset yang Dibeli</Label>
                                        <select
                                            id="coa_debit_id"
                                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                            value={data.coa_debit_id}
                                            onChange={(e) => setData('coa_debit_id', e.target.value)}
                                            required
                                        >
                                            <option value="">-- Pilih Akun Aset --</option>
                                            {Object.entries(groupCoasByParent(displayDebitCoas)).map(([parentLabel, items]) => (
                                                <optgroup key={parentLabel} label={parentLabel}>
                                                    {items.map((coa) => (
                                                        <option key={coa.id} value={coa.id}>
                                                            [{coa.kode_akun}] {coa.nama_akun}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        {errors.coa_debit_id && <span className="text-xs text-red-500">{errors.coa_debit_id}</span>}
                                    </div>

                                    {/* Akun Pembayaran (Kredit) */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="coa_kredit_id">Akun Kredit — Sumber Pembayaran</Label>
                                        <select
                                            id="coa_kredit_id"
                                            className="border-input bg-background text-foreground ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-hidden"
                                            value={data.coa_kredit_id}
                                            onChange={(e) => setData('coa_kredit_id', e.target.value)}
                                            required
                                        >
                                            <option value="">-- Pilih Sumber Pembayaran --</option>
                                            {Object.entries(groupCoasByParent(displayCreditCoas)).map(([parentLabel, items]) => (
                                                <optgroup key={parentLabel} label={parentLabel}>
                                                    {items.map((coa) => (
                                                        <option key={coa.id} value={coa.id}>
                                                            [{coa.kode_akun}] {coa.nama_akun}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        {errors.coa_kredit_id && <span className="text-xs text-red-500">{errors.coa_kredit_id}</span>}
                                    </div>

                                    {/* Nilai Residu */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="nilai_residu">Nilai Residu (Rp)</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="nilai_residu"
                                                type="number"
                                                value={data.nilai_residu}
                                                readOnly
                                                disabled
                                                className="bg-muted text-muted-foreground select-none cursor-not-allowed w-32"
                                                required
                                            />
                                            <span className="text-muted-foreground text-xs">
                                                Nilai residu ditetapkan tetap Rp 1 untuk keperluan audit.
                                            </span>
                                        </div>
                                        {errors.nilai_residu && <span className="text-xs text-red-500">{errors.nilai_residu}</span>}
                                    </div>
                                </div>
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
