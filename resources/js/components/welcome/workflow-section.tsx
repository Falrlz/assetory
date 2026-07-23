import { Section, SectionHeading } from '@/components/welcome/container';

const steps = [
    {
        title: 'Catat aset & saldo awal',
        description: 'Masukkan daftar aset beserta harga perolehan dan golongan pajaknya, lalu tetapkan saldo awal setiap akun.',
    },
    {
        title: 'Jalankan penyusutan & jurnal',
        description: 'Sistem menghitung penyusutan bulanan dan memvalidasi keseimbangan debit-kredit sebelum jurnal tersimpan.',
    },
    {
        title: 'Terbitkan laporan keuangan',
        description: 'Neraca, laba rugi, arus kas, dan laporan lainnya tersusun otomatis dari data jurnal yang sudah terposting.',
    },
];

export function WorkflowSection() {
    return (
        <Section id="cara-kerja" className="bg-neutral-50 dark:bg-neutral-900/30">
            <div>
                <SectionHeading
                    eyebrow="Cara Kerja"
                    title="Tiga langkah dari pencatatan ke laporan"
                    description="Alur kerja akuntansi yang panjang dipersingkat menjadi rangkaian langkah yang jelas dan dapat diulang setiap periode."
                />

                <ol className="mt-10 grid gap-8 sm:mt-12 md:grid-cols-3 md:gap-6">
                    {steps.map((step, index) => (
                        <li key={step.title} className="relative">
                            {index < steps.length - 1 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-5 left-14 hidden h-px w-[calc(100%-2.5rem)] bg-neutral-200 md:block dark:bg-neutral-800"
                                />
                            )}
                            <span className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                                {index + 1}
                            </span>
                            <h3 className="mt-5 text-base font-semibold text-neutral-900 dark:text-white">{step.title}</h3>
                            <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{step.description}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </Section>
    );
}
