import { Field, FilterBar, PageHeader, PageShell, SectionHeading } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableContainer, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type Asset, type BreadcrumbItem, type Coa, type Journal } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Calculator, Calendar, ClipboardList, Coins, FileText, type LucideIcon, Plus, Search, TrendingDown, X } from 'lucide-react';
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

const BULAN_OPTIONS = [
    ['01', 'Januari'],
    ['02', 'Februari'],
    ['03', 'Maret'],
    ['04', 'April'],
    ['05', 'Mei'],
    ['06', 'Juni'],
    ['07', 'Juli'],
    ['08', 'Agustus'],
    ['09', 'September'],
    ['10', 'Oktober'],
    ['11', 'November'],
    ['12', 'Desember'],
];

interface ScheduleRow {
    bulanKe: number;
    periode: string;
    penyusutanBulanan: number;
    akumulasiPenyusutan: number;
    nilaiBuku: number;
    isTerlewati: boolean;
}

/** Summary tile above the asset table; mirrors the dashboard KPI proportions. */
function StatCard({
    label,
    value,
    caption,
    icon: Icon,
    valueClassName,
}: {
    label: string;
    value: string;
    caption: string;
    icon: LucideIcon;
    valueClassName?: string;
}) {
    return (
        <div className="bg-card rounded-xl border p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-muted-foreground text-xs font-medium">{label}</h2>
                <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            </div>
            <p className={cn('text-foreground mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums', valueClassName)}>{value}</p>
            <p className="text-muted-foreground mt-1.5 text-xs">{caption}</p>
        </div>
    );
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
                if (
                    data.jenis === 'inventaris' &&
                    (coa.kode_akun === '01.3000.01.04' ||
                        coa.nama_akun.toLowerCase().includes('peralatan') ||
                        coa.nama_akun.toLowerCase().includes('inventaris'))
                ) {
                    return true;
                }
                if (data.jenis === 'kendaraan' && (coa.kode_akun === '01.3000.01.03' || coa.nama_akun.toLowerCase().includes('kendaraan'))) {
                    return true;
                }
                if (
                    data.jenis === 'gedung' &&
                    (coa.kode_akun === '01.3000.01.02' ||
                        coa.nama_akun.toLowerCase().includes('gedung') ||
                        coa.nama_akun.toLowerCase().includes('bangunan'))
                ) {
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
                let kreditCoa = transactionCoas.find((c) => c.kode_akun === defaultKreditCode);
                if (!kreditCoa) {
                    kreditCoa = transactionCoas.find((c) => c.kode_akun.startsWith('01.1000.'));
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
            if (
                data.jenis === 'inventaris' &&
                (coa.kode_akun === '01.3000.01.04' ||
                    coa.nama_akun.toLowerCase().includes('peralatan') ||
                    coa.nama_akun.toLowerCase().includes('inventaris'))
            ) {
                return true;
            }
            if (data.jenis === 'kendaraan' && (coa.kode_akun === '01.3000.01.03' || coa.nama_akun.toLowerCase().includes('kendaraan'))) {
                return true;
            }
            if (
                data.jenis === 'gedung' &&
                (coa.kode_akun === '01.3000.01.02' ||
                    coa.nama_akun.toLowerCase().includes('gedung') ||
                    coa.nama_akun.toLowerCase().includes('bangunan'))
            ) {
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

            <PageShell>
                <PageHeader
                    title="Daftar Aset"
                    description="Kelola aset Anda dan pantau depresiasi otomatis dengan metode garis lurus."
                    actions={
                        <Button onClick={() => setIsOpen(true)}>
                            <Plus />
                            Tambah Aset
                        </Button>
                    }
                />

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Aset" value={String(totalAssets)} caption="Jumlah aset terdaftar" icon={ClipboardList} />
                    <StatCard label="Total Nilai Perolehan" value={formatRupiah(totalHargaPerolehan)} caption="Kapitalisasi aset awal" icon={Coins} />
                    <StatCard
                        label="Akumulasi Depresiasi"
                        value={formatRupiah(totalAkumulasiPenyusutan)}
                        caption="Total nilai penyusutan berjalan"
                        icon={TrendingDown}
                        valueClassName="text-rose-600 dark:text-rose-400"
                    />
                    <StatCard
                        label="Total Nilai Buku"
                        value={formatRupiah(totalNilaiBuku)}
                        caption="Sisa nilai ekonomis saat ini"
                        icon={Calculator}
                        valueClassName="text-emerald-600 dark:text-emerald-400"
                    />
                </div>

                {/* Filter Controls */}
                <FilterBar className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    <Field>
                        <Label htmlFor="search">Cari Nama Aset</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                id="search"
                                inputSize="sm"
                                placeholder="Ketik nama aset..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </Field>

                    <Field>
                        <Label htmlFor="jenis_filter">Jenis Aset</Label>
                        <NativeSelect id="jenis_filter" selectSize="sm" value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
                            <option value="all">Semua Jenis</option>
                            <option value="inventaris">Inventaris</option>
                            <option value="kendaraan">Kendaraan</option>
                            <option value="gedung">Gedung</option>
                        </NativeSelect>
                    </Field>

                    <Field>
                        <Label htmlFor="tahun_filter">Tahun Perolehan</Label>
                        <NativeSelect
                            id="tahun_filter"
                            selectSize="sm"
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
                        </NativeSelect>
                    </Field>

                    <Field>
                        <Label htmlFor="bulan_filter">Bulan Perolehan</Label>
                        <NativeSelect
                            id="bulan_filter"
                            selectSize="sm"
                            value={filterBulan}
                            onChange={(e) => {
                                setFilterBulan(e.target.value);
                                setFilterTanggal(''); // clear specific date to avoid filter conflicts
                            }}
                        >
                            <option value="all">Semua Bulan</option>
                            {BULAN_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>

                    <div className="flex items-end gap-2">
                        <Field className="min-w-0 flex-1">
                            <Label htmlFor="tanggal_filter">Tanggal Spesifik</Label>
                            <DatePicker
                                id="tanggal_filter"
                                size="sm"
                                value={filterTanggal}
                                onChange={(val) => {
                                    setFilterTanggal(val);
                                    if (val) {
                                        setFilterTahun('all');
                                        setFilterBulan('all');
                                    }
                                }}
                            />
                        </Field>
                        {isFilterActive && (
                            <Button type="button" variant="outline" size="icon-sm" onClick={handleResetFilters} title="Reset filter">
                                <X />
                                <span className="sr-only">Reset filter</span>
                            </Button>
                        )}
                    </div>
                </FilterBar>

                {/* Asset Table */}
                <TableContainer>
                    <Table minWidth="min-w-[1100px]">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-[180px]">Nama Aset</TableHead>
                                <TableHead align="center" className="w-32">
                                    Jenis
                                </TableHead>
                                <TableHead className="w-44">Kelompok Umur</TableHead>
                                <TableHead align="center" className="w-36">
                                    Tgl Perolehan
                                </TableHead>
                                <TableHead align="center" className="w-28">
                                    Umur
                                </TableHead>
                                <TableHead align="right" className="w-40">
                                    Harga Perolehan
                                </TableHead>
                                <TableHead align="right" className="w-32">
                                    Nilai Residu
                                </TableHead>
                                <TableHead align="right" className="w-40">
                                    Penyusutan/Bulan
                                </TableHead>
                                <TableHead align="right" className="w-44">
                                    Akumulasi Penyusutan
                                </TableHead>
                                <TableHead align="right" className="w-40">
                                    Nilai Buku
                                </TableHead>
                                <TableHead align="center" className="w-28">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAssets.length === 0 ? (
                                <TableEmpty
                                    colSpan={11}
                                    icon={<Search className="text-muted-foreground/40 mb-1 size-10" />}
                                    title="Tidak Ada Hasil Cocok"
                                    description="Coba sesuaikan kata kunci pencarian atau bersihkan filter Anda."
                                />
                            ) : (
                                filteredAssets.map((asset) => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="text-foreground font-medium">{asset.nama}</TableCell>
                                        <TableCell align="center">
                                            <Badge variant="secondary" className="capitalize">
                                                {asset.jenis}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{PERIODE_LABELS[asset.periode]}</TableCell>
                                        <TableCell align="center" className="text-muted-foreground font-mono tabular-nums">
                                            {formatDate(asset.tanggal_perolehan)}
                                        </TableCell>
                                        <TableCell align="center" className="text-foreground font-mono tabular-nums">
                                            {PERIODE_BULAN[asset.periode]} bln
                                        </TableCell>
                                        <TableCell numeric className="font-medium">
                                            {formatRupiah(asset.harga_perolehan)}
                                        </TableCell>
                                        <TableCell numeric className="text-muted-foreground">
                                            {formatRupiah(asset.nilai_residu)}
                                        </TableCell>
                                        <TableCell numeric className="text-muted-foreground">
                                            {formatRupiah(asset.penyusutan_bulanan)}
                                        </TableCell>
                                        <TableCell numeric className="font-medium text-rose-600 dark:text-rose-400">
                                            {formatRupiah(asset.akumulasi_penyusutan)}
                                            <span className="text-muted-foreground block text-xs font-normal">
                                                {asset.masa_penggunaan_bulan} bulan berjalan
                                            </span>
                                        </TableCell>
                                        <TableCell numeric className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {formatRupiah(asset.nilai_buku)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenSchedule(asset)}>
                                                <Calendar />
                                                Jadwal
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Asset Journals */}
                <SectionHeading
                    title="Jurnal Terbentuk"
                    description="Menampilkan hingga 10 transaksi perolehan dan depresiasi aset terbaru yang tercatat secara resmi di jurnal."
                />

                {assetJournals.length === 0 ? (
                    <div className="bg-card flex flex-col items-center justify-center gap-1 rounded-xl border py-12 text-center shadow-xs">
                        <FileText className="text-muted-foreground/40 mb-2 size-10" aria-hidden="true" />
                        <h3 className="text-base font-semibold">Belum Ada Jurnal Aset</h3>
                        <p className="text-muted-foreground max-w-sm text-sm">
                            Jurnal akan otomatis terbentuk saat aset ditambahkan atau ketika Anda memposting penyusutan bulanan.
                        </p>
                    </div>
                ) : (
                    <TableContainer>
                        <Table minWidth="min-w-[1000px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead align="center" className="w-32">
                                        Tanggal
                                    </TableHead>
                                    <TableHead className="w-44">No. Referensi</TableHead>
                                    <TableHead className="min-w-[200px]">Rincian Transaksi</TableHead>
                                    <TableHead align="center" className="w-28">
                                        No Arus Kas
                                    </TableHead>
                                    <TableHead className="w-36">Kode Akun</TableHead>
                                    <TableHead className="min-w-[180px]">Nama Akun</TableHead>
                                    <TableHead align="right" className="w-40">
                                        Debit
                                    </TableHead>
                                    <TableHead align="right" className="w-40">
                                        Kredit
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assetJournals.flatMap((journal) => {
                                    const items = journal.items ?? [];

                                    return items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            {index === 0 ? (
                                                <>
                                                    <TableCell
                                                        align="center"
                                                        className="text-muted-foreground align-top font-mono font-medium tabular-nums"
                                                        rowSpan={items.length}
                                                    >
                                                        {formatDate(journal.tanggal)}
                                                    </TableCell>
                                                    <TableCell className="space-y-1.5 align-top" rowSpan={items.length}>
                                                        <span className="text-foreground block font-mono text-xs font-bold">
                                                            {journal.nomor_jurnal}
                                                        </span>
                                                        <Badge variant={journal.tipe_jurnal === 'penyusutan' ? 'warning' : 'info'}>
                                                            {journal.tipe_jurnal === 'penyusutan' ? 'Penyusutan' : 'Perolehan'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground align-top break-words" rowSpan={items.length}>
                                                        {journal.keterangan}
                                                    </TableCell>
                                                </>
                                            ) : null}
                                            <TableCell align="center" className="text-foreground font-mono text-xs">
                                                {journal.kode_arus_kas || '-'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">{item.coa?.kode_akun}</TableCell>
                                            <TableCell
                                                className={Number(item.kredit) > 0 ? 'text-muted-foreground pl-8' : 'text-foreground font-medium'}
                                            >
                                                {item.coa?.nama_akun}
                                            </TableCell>
                                            <TableCell numeric className="text-foreground font-medium">
                                                {Number(item.debit) > 0 ? formatRupiah(item.debit) : '-'}
                                            </TableCell>
                                            <TableCell numeric className="text-foreground font-medium">
                                                {Number(item.kredit) > 0 ? formatRupiah(item.kredit) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ));
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </PageShell>

            {/* Create Asset Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <form onSubmit={handleSubmit} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>Tambah Aset Baru</DialogTitle>
                            <DialogDescription>Masukkan rincian data aset. Perhitungan penyusutan akan dilakukan secara otomatis.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <Field>
                                <Label htmlFor="nama">Nama Aset</Label>
                                <Input
                                    id="nama"
                                    placeholder="Contoh: Laptop MacBook Pro"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    required
                                />
                                {errors.nama && <p className="text-destructive text-xs font-medium">{errors.nama}</p>}
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field>
                                    <Label htmlFor="jenis">Jenis Aset</Label>
                                    <NativeSelect id="jenis" value={data.jenis} onChange={(e) => setData('jenis', e.target.value)}>
                                        <option value="inventaris">Inventaris</option>
                                        <option value="kendaraan">Kendaraan</option>
                                        <option value="gedung">Gedung</option>
                                    </NativeSelect>
                                    {errors.jenis && <p className="text-destructive text-xs font-medium">{errors.jenis}</p>}
                                </Field>

                                <Field>
                                    <Label htmlFor="periode">Kelompok Masa Manfaat</Label>
                                    <NativeSelect id="periode" value={data.periode} onChange={(e) => setData('periode', e.target.value)}>
                                        {Object.entries(PERIODE_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    {errors.periode && <p className="text-destructive text-xs font-medium">{errors.periode}</p>}
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field>
                                    <Label htmlFor="tanggal_perolehan">Tanggal Perolehan</Label>
                                    <DatePicker
                                        id="tanggal_perolehan"
                                        value={data.tanggal_perolehan}
                                        onChange={(val) => setData('tanggal_perolehan', val)}
                                    />
                                    {errors.tanggal_perolehan && <p className="text-destructive text-xs font-medium">{errors.tanggal_perolehan}</p>}
                                </Field>

                                <Field>
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
                                    {errors.harga_perolehan && <p className="text-destructive text-xs font-medium">{errors.harga_perolehan}</p>}
                                </Field>
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-foreground text-sm font-semibold">Pengaturan Akuntansi &amp; Jurnal</h3>

                                <Field>
                                    <Label htmlFor="coa_debit_id">Akun Debit — Aset yang Dibeli</Label>
                                    <NativeSelect
                                        id="coa_debit_id"
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
                                    </NativeSelect>
                                    {errors.coa_debit_id && <p className="text-destructive text-xs font-medium">{errors.coa_debit_id}</p>}
                                </Field>

                                <Field>
                                    <Label htmlFor="coa_kredit_id">Akun Kredit — Sumber Pembayaran</Label>
                                    <NativeSelect
                                        id="coa_kredit_id"
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
                                    </NativeSelect>
                                    {errors.coa_kredit_id && <p className="text-destructive text-xs font-medium">{errors.coa_kredit_id}</p>}
                                </Field>

                                <Field>
                                    <Label htmlFor="nilai_residu">Nilai Residu (Rp)</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="nilai_residu"
                                            type="number"
                                            value={data.nilai_residu}
                                            readOnly
                                            disabled
                                            className="bg-muted w-32 shrink-0 cursor-not-allowed font-mono select-none"
                                            required
                                        />
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Nilai residu ditetapkan tetap Rp 1 untuk keperluan audit.
                                        </p>
                                    </div>
                                    {errors.nilai_residu && <p className="text-destructive text-xs font-medium">{errors.nilai_residu}</p>}
                                </Field>
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
                <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[760px]">
                    <DialogHeader>
                        <DialogTitle>Jadwal Penyusutan Bulanan</DialogTitle>
                        <DialogDescription>
                            Proyeksi penyusutan bulanan untuk aset <strong>{selectedAsset?.nama}</strong> hingga masa manfaat berakhir.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAsset && (
                        <div className="flex min-h-0 flex-1 flex-col gap-4">
                            <dl className="bg-muted/40 grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border p-4 text-sm sm:grid-cols-2">
                                {[
                                    ['Harga Perolehan', formatRupiah(selectedAsset.harga_perolehan)],
                                    ['Nilai Residu', formatRupiah(selectedAsset.nilai_residu)],
                                    ['Kelompok Umur', PERIODE_LABELS[selectedAsset.periode]],
                                    ['Penyusutan Bulanan', formatRupiah(selectedAsset.penyusutan_bulanan)],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex items-baseline justify-between gap-3">
                                        <dt className="text-muted-foreground">{label}</dt>
                                        <dd className="text-foreground font-semibold">{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            <TableContainer className="min-h-0 flex-1">
                                <Table wrapperClassName="max-h-[45vh] overflow-y-auto" minWidth="min-w-[620px]">
                                    <TableHeader sticky>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead align="center" className="bg-muted w-24">
                                                Bulan Ke
                                            </TableHead>
                                            <TableHead className="bg-muted min-w-[140px]">Periode</TableHead>
                                            <TableHead align="right" className="bg-muted w-36">
                                                Penyusutan
                                            </TableHead>
                                            <TableHead align="right" className="bg-muted w-36">
                                                Akumulasi
                                            </TableHead>
                                            <TableHead align="right" className="bg-muted w-36">
                                                Nilai Buku
                                            </TableHead>
                                            <TableHead align="center" className="bg-muted w-28">
                                                Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {generateDepreciationSchedule(selectedAsset).map((row) => (
                                            <TableRow key={row.bulanKe} className={row.isTerlewati ? 'bg-muted/20' : undefined}>
                                                <TableCell align="center" className="font-mono tabular-nums">
                                                    {row.bulanKe}
                                                </TableCell>
                                                <TableCell className="font-medium">{row.periode}</TableCell>
                                                <TableCell numeric className="text-muted-foreground">
                                                    {formatRupiah(row.penyusutanBulanan)}
                                                </TableCell>
                                                <TableCell numeric className="text-muted-foreground">
                                                    {formatRupiah(row.akumulasiPenyusutan)}
                                                </TableCell>
                                                <TableCell numeric className="text-foreground font-semibold">
                                                    {formatRupiah(row.nilaiBuku)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Badge variant={row.isTerlewati ? 'muted' : 'info'}>
                                                        {row.isTerlewati ? 'Terlewati' : 'Proyeksi'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    )}

                    <DialogFooter className="border-t pt-4">
                        <Button onClick={() => setIsScheduleOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
