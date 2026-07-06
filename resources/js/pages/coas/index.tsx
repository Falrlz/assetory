import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Coa } from '@/types';
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
import { Plus, Edit, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Chart of Accounts',
        href: '/coas',
    },
];

interface CoasProps {
    coas: Coa[];
}

const KATEGORI_LABELS: Record<string, string> = {
    aset: 'Aset / Harta',
    kewajiban: 'Kewajiban / Utang',
    ekuitas: 'Ekuitas / Modal',
    pendapatan: 'Pendapatan',
    beban: 'Beban',
};

const SALDO_LABELS: Record<string, string> = {
    debit: 'Debit',
    kredit: 'Kredit',
};

export default function Index({ coas }: CoasProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCoa, setSelectedCoa] = useState<Coa | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');

    // Create Form
    const { data, setData, post, processing, errors, reset } = useForm({
        kode_akun: '',
        nama_akun: '',
        kategori: 'aset' as Coa['kategori'],
        saldo_normal: 'debit' as Coa['saldo_normal'],
    });

    // Edit Form
    const editForm = useForm({
        kode_akun: '',
        nama_akun: '',
        kategori: 'aset' as Coa['kategori'],
        saldo_normal: 'debit' as Coa['saldo_normal'],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('coas.store'), {
            onSuccess: () => {
                setIsOpen(false);
                reset();
            },
        });
    };

    const handleOpenEdit = (coa: Coa) => {
        setSelectedCoa(coa);
        editForm.setData({
            kode_akun: coa.kode_akun,
            nama_akun: coa.nama_akun,
            kategori: coa.kategori,
            saldo_normal: coa.saldo_normal,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoa) return;
        
        editForm.put(route('coas.update', selectedCoa.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedCoa(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
            editForm.delete(route('coas.destroy', id));
        }
    };

    // Filter COA berdasarkan tab aktif
    const filteredCoas = coas.filter((coa) => {
        if (activeTab === 'all') return true;
        return coa.kategori === activeTab;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chart of Accounts (COA)" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 min-w-0">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts (COA)</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola daftar akun untuk mencatat transaksi keuangan organisasi Anda secara terstruktur.
                        </p>
                    </div>
                    <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Akun
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 border-b pb-4">
                    <Button
                        variant={activeTab === 'all' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('all')}
                        size="sm"
                    >
                        Semua Akun ({coas.length})
                    </Button>
                    {Object.entries(KATEGORI_LABELS).map(([key, label]) => {
                        const count = coas.filter((c) => c.kategori === key).length;
                        return (
                            <Button
                                key={key}
                                variant={activeTab === key ? 'default' : 'outline'}
                                onClick={() => setActiveTab(key)}
                                size="sm"
                            >
                                {label} ({count})
                            </Button>
                        );
                    })}
                </div>

                {/* Table Section */}
                <div className="w-full overflow-hidden rounded-xl border bg-card shadow-xs">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <th className="px-6 py-4">Kode Akun</th>
                                    <th className="px-6 py-4">Nama Akun</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Saldo Normal</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {filteredCoas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            Belum ada data akun untuk kategori ini.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCoas.map((coa) => (
                                        <tr key={coa.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-foreground">
                                                {coa.kode_akun}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {coa.nama_akun}
                                            </td>
                                            <td className="px-6 py-4 capitalize text-muted-foreground">
                                                {KATEGORI_LABELS[coa.kategori]}
                                            </td>
                                            <td className="px-6 py-4 capitalize text-muted-foreground">
                                                {SALDO_LABELS[coa.saldo_normal]}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleOpenEdit(coa)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600"
                                                        onClick={() => handleDelete(coa.id)}
                                                        title="Hapus Akun"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create COA Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Akun Baru</DialogTitle>
                            <DialogDescription>
                                Buat akun keuangan baru untuk pencatatan transaksi jurnal Anda.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Kode Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="kode_akun">Kode Akun</Label>
                                <Input
                                    id="kode_akun"
                                    placeholder="Contoh: 1-1001 atau 5-1005"
                                    value={data.kode_akun}
                                    onChange={(e) => setData('kode_akun', e.target.value)}
                                    required
                                />
                                <span className="text-[10px] text-muted-foreground">Format umum: [Kategori]-[Nomor Urut] (Contoh: 1-1001)</span>
                                {errors.kode_akun && <span className="text-xs text-red-500">{errors.kode_akun}</span>}
                            </div>

                            {/* Nama Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="nama_akun">Nama Akun</Label>
                                <Input
                                    id="nama_akun"
                                    placeholder="Contoh: Kas Kecil, Piutang Usaha"
                                    value={data.nama_akun}
                                    onChange={(e) => setData('nama_akun', e.target.value)}
                                    required
                                />
                                {errors.nama_akun && <span className="text-xs text-red-500">{errors.nama_akun}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Kategori */}
                                <div className="grid gap-2">
                                    <Label htmlFor="kategori">Kategori Akun</Label>
                                    <select
                                        id="kategori"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                                        value={data.kategori}
                                        onChange={(e) => setData('kategori', e.target.value as Coa['kategori'])}
                                    >
                                        <option value="aset">Aset / Harta</option>
                                        <option value="kewajiban">Kewajiban / Utang</option>
                                        <option value="ekuitas">Ekuitas / Modal</option>
                                        <option value="pendapatan">Pendapatan</option>
                                        <option value="beban">Beban</option>
                                    </select>
                                    {errors.kategori && <span className="text-xs text-red-500">{errors.kategori}</span>}
                                </div>

                                {/* Saldo Normal */}
                                <div className="grid gap-2">
                                    <Label htmlFor="saldo_normal">Saldo Normal</Label>
                                    <select
                                        id="saldo_normal"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                                        value={data.saldo_normal}
                                        onChange={(e) => setData('saldo_normal', e.target.value as Coa['saldo_normal'])}
                                    >
                                        <option value="debit">Debit</option>
                                        <option value="kredit">Kredit</option>
                                    </select>
                                    {errors.saldo_normal && <span className="text-xs text-red-500">{errors.saldo_normal}</span>}
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
                                Simpan Akun
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit COA Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Edit Detail Akun</DialogTitle>
                            <DialogDescription>
                                Perbarui rincian untuk akun keuangan terpilih.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Kode Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="edit_kode_akun">Kode Akun</Label>
                                <Input
                                    id="edit_kode_akun"
                                    value={editForm.data.kode_akun}
                                    onChange={(e) => editForm.setData('kode_akun', e.target.value)}
                                    required
                                />
                                {editForm.errors.kode_akun && <span className="text-xs text-red-500">{editForm.errors.kode_akun}</span>}
                            </div>

                            {/* Nama Akun */}
                            <div className="grid gap-2">
                                <Label htmlFor="edit_nama_akun">Nama Akun</Label>
                                <Input
                                    id="edit_nama_akun"
                                    value={editForm.data.nama_akun}
                                    onChange={(e) => editForm.setData('nama_akun', e.target.value)}
                                    required
                                />
                                {editForm.errors.nama_akun && <span className="text-xs text-red-500">{editForm.errors.nama_akun}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Kategori */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_kategori">Kategori Akun</Label>
                                    <select
                                        id="edit_kategori"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                                        value={editForm.data.kategori}
                                        onChange={(e) => editForm.setData('kategori', e.target.value as Coa['kategori'])}
                                    >
                                        <option value="aset">Aset / Harta</option>
                                        <option value="kewajiban">Kewajiban / Utang</option>
                                        <option value="ekuitas">Ekuitas / Modal</option>
                                        <option value="pendapatan">Pendapatan</option>
                                        <option value="beban">Beban</option>
                                    </select>
                                    {editForm.errors.kategori && <span className="text-xs text-red-500">{editForm.errors.kategori}</span>}
                                </div>

                                {/* Saldo Normal */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit_saldo_normal">Saldo Normal</Label>
                                    <select
                                        id="edit_saldo_normal"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                                        value={editForm.data.saldo_normal}
                                        onChange={(e) => editForm.setData('saldo_normal', e.target.value as Coa['saldo_normal'])}
                                    >
                                        <option value="debit">Debit</option>
                                        <option value="kredit">Kredit</option>
                                    </select>
                                    {editForm.errors.saldo_normal && <span className="text-xs text-red-500">{editForm.errors.saldo_normal}</span>}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setSelectedCoa(null);
                                    editForm.reset();
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
