import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Asset {
    id: number;
    user_id: number;
    nama: string;
    jenis: 'inventaris' | 'kendaraan' | 'gedung';
    harga_perolehan: number | string;
    nilai_residu: number | string;
    tanggal_perolehan: string;
    periode: 'periode_1' | 'periode_2' | 'periode_3' | 'periode_4';
    penyusutan_tahunan: number;
    penyusutan_bulanan: number;
    masa_penggunaan_bulan: number;
    akumulasi_penyusutan: number;
    nilai_buku: number;
    created_at: string;
    updated_at: string;
}

export interface Coa {
    id: number;
    user_id: number;
    kode_akun: string;
    nama_akun: string;
    kategori: 'aset' | 'kewajiban' | 'ekuitas' | 'pendapatan' | 'beban';
    saldo_normal: 'debit' | 'kredit';
    jenis_laporan: 'LPK' | 'LR';
    created_at: string;
    updated_at: string;
}

export interface JournalItem {
    id: number;
    journal_id: number;
    coa_id: number;
    debit: string;
    kredit: string;
    coa?: Coa;
    created_at: string;
    updated_at: string;
}

export interface Journal {
    id: number;
    user_id: number;
    tanggal: string;
    nomor_jurnal: string;
    keterangan: string;
    tipe_jurnal: 'umum' | 'perolehan_aset' | 'penyusutan';
    ref_id?: number;
    jenis_transaksi?: string;
    kategori_arus_kas?: string;
    kode_arus_kas?: string;
    reversed_by_id?: number;
    reverses_journal_id?: number;
    reversed_by?: Journal;
    reverses_journal?: Journal;
    items?: JournalItem[];
    created_at: string;
    updated_at: string;
}
