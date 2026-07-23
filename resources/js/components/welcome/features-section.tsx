import { Card } from '@/components/ui/card';
import { Section, SectionHeading } from '@/components/welcome/container';
import { BarChart3, BookOpen, Building2, Calculator, Notebook, ShieldCheck } from 'lucide-react';

const features = [
    {
        icon: Building2,
        tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
        title: 'Manajemen Aset Tetap',
        description: 'Catat harga perolehan, nilai residu, dan golongan pajak setiap aset dalam satu daftar terpusat.',
    },
    {
        icon: Calculator,
        tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
        title: 'Penyusutan Otomatis',
        description: 'Perhitungan garis lurus bulanan dan kumulatif berjalan otomatis, siap diposting ke buku besar sekali klik.',
    },
    {
        icon: Notebook,
        tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
        title: 'Jurnal Double-Entry',
        description: 'Nomor voucher berurutan otomatis, validasi debit-kredit yang ketat, dan dukungan jurnal balik.',
    },
    {
        icon: BookOpen,
        tone: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
        title: 'Chart of Accounts Bertingkat',
        description: 'Struktur akun standar untuk aset, liabilitas, ekuitas, pendapatan, dan beban tersedia sejak hari pertama.',
    },
    {
        icon: BarChart3,
        tone: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
        title: 'Dashboard Real-Time',
        description: 'KPI keuangan, grafik tren pendapatan versus beban, dan aktivitas jurnal terakhir dalam satu layar.',
    },
    {
        icon: ShieldCheck,
        tone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
        title: 'Isolasi Data Multi-Tenant',
        description: 'Setiap akun, aset, dan transaksi terkunci pada penggunanya masing-masing tanpa konfigurasi tambahan.',
    },
];

export function FeaturesSection() {
    return (
        <Section id="fitur">
            <div>
                <SectionHeading
                    eyebrow="Fitur"
                    title="Semua yang dibutuhkan untuk pembukuan yang rapi"
                    description="Dari pencatatan aset sampai penyusunan laporan, seluruh alurnya berjalan di dalam satu aplikasi yang sama."
                />

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    {features.map((feature) => (
                        <Card
                            key={feature.title}
                            className="rounded-xl border-neutral-200 bg-white p-6 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            <span className={`flex size-10 items-center justify-center rounded-lg ${feature.tone}`}>
                                <feature.icon className="size-5" aria-hidden="true" />
                            </span>
                            <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-white">{feature.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{feature.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </Section>
    );
}
