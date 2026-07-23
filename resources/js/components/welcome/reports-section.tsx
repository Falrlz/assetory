import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/welcome/container';
import { BookOpen, Check, Coins, FileText, Notebook, Scale, TrendingUp } from 'lucide-react';

const reports = [
    {
        icon: FileText,
        tone: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
        title: 'Neraca Keuangan',
        caption: 'Laporan posisi keuangan',
    },
    {
        icon: TrendingUp,
        tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
        title: 'Laba dan Rugi',
        caption: 'Kinerja hasil usaha',
    },
    { icon: Coins, tone: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400', title: 'Arus Kas', caption: 'Arus masuk & keluar kas' },
    {
        icon: BookOpen,
        tone: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
        title: 'Neraca Saldo',
        caption: 'Trial balance akun',
    },
    {
        icon: Scale,
        tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
        title: 'Perubahan Ekuitas',
        caption: 'Mutasi modal periode',
    },
    {
        icon: Notebook,
        tone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
        title: 'CALK',
        caption: 'Catatan atas laporan keuangan',
    },
];

const guarantees = [
    'Dihitung ulang setiap kali jurnal berubah, tanpa proses tutup buku manual.',
    'Tampilan siap cetak untuk kebutuhan audit dan pelaporan pajak.',
    'Angka pada setiap laporan bersumber dari buku besar yang sama.',
];

export function ReportsSection() {
    return (
        <Section id="laporan">
            <div className="w-full">
                <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-8 xl:gap-16">
                    <div className="max-w-xl">
                        <Badge variant="secondary" className="font-medium tracking-wide uppercase">
                            Laporan
                        </Badge>
                        <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl dark:text-white">
                            Enam laporan keuangan, tersusun otomatis
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
                            Tidak perlu menyalin angka antar spreadsheet. Setiap laporan dibangun langsung dari jurnal yang sudah terposting sehingga
                            selalu konsisten satu sama lain.
                        </p>

                        <ul className="mt-8 space-y-4 lg:space-y-3">
                            {guarantees.map((item) => (
                                <li key={item} className="flex gap-3">
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        <Check className="size-3" aria-hidden="true" />
                                    </span>
                                    <span className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <ul className="grid gap-4 sm:grid-cols-2 lg:gap-6">
                        {reports.map((report) => (
                            <li
                                key={report.title}
                                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${report.tone}`}>
                                    <report.icon className="size-4" aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">{report.title}</span>
                                    <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">{report.caption}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Section>
    );
}
