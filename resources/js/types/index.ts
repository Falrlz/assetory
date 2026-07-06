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
    created_at: string;
    updated_at: string;
}
