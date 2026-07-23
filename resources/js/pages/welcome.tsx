import { CtaSection } from '@/components/welcome/cta-section';
import { FeaturesSection } from '@/components/welcome/features-section';
import { HeroSection } from '@/components/welcome/hero-section';
import { ReportsSection } from '@/components/welcome/reports-section';
import { SiteFooter } from '@/components/welcome/site-footer';
import { SiteHeader } from '@/components/welcome/site-header';
import { WorkflowSection } from '@/components/welcome/workflow-section';
import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Assetory - Manajemen Aset & Akuntansi">
                <meta
                    name="description"
                    content="Assetory menyederhanakan manajemen aset tetap dan akuntansi double-entry dengan penyusutan otomatis serta laporan keuangan real-time."
                />
            </Head>

            <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
                <a
                    href="#konten-utama"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-white dark:focus:text-neutral-900"
                >
                    Lewati ke konten utama
                </a>

                <SiteHeader />

                <main id="konten-utama">
                    <HeroSection />
                    <FeaturesSection />
                    <WorkflowSection />
                    <ReportsSection />
                    <CtaSection />
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
