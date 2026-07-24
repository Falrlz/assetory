import type { ReactNode } from 'react';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Printer, RotateCcw } from 'lucide-react';

/** Page title row shared by every report, including the print action. */
export function ReportToolbar({ title, description }: { title: string; description: string }) {
    return (
        <PageHeader
            className="print:hidden"
            title={title}
            description={description}
            actions={
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer />
                    Cetak Laporan
                </Button>
            }
        />
    );
}

interface ReportFilterCardProps {
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
    children: ReactNode;
}

/** Date-range controls plus the Apply/Reset pair, laid out identically everywhere. */
export function ReportFilterCard({ onSubmit, onReset, children }: ReportFilterCardProps) {
    return (
        <form onSubmit={onSubmit} className="bg-card flex flex-wrap items-end gap-4 rounded-xl border p-4 shadow-xs print:hidden">
            {children}
            <div className="flex items-end gap-2">
                <Button type="submit">Terapkan Filter</Button>
                <Button type="button" variant="outline" onClick={onReset}>
                    <RotateCcw />
                    Reset
                </Button>
            </div>
        </form>
    );
}

interface ReportDocumentProps {
    /** Small line above the document title, e.g. the company name. */
    eyebrow?: string;
    title: string;
    period: string;
    className?: string;
    children: ReactNode;
}

/**
 * The printable sheet. Its heading block renders on screen and on paper, so the
 * printed output no longer needs a second, duplicated header.
 */
export function ReportDocument({ eyebrow = 'Assetory', title, period, className, children }: ReportDocumentProps) {
    return (
        <div className={cn('bg-card rounded-xl border p-5 shadow-xs sm:p-8 print:border-none print:p-0 print:shadow-none', className)}>
            <header className="mb-8 space-y-1 text-center">
                <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">{eyebrow}</p>
                <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
                <p className="text-muted-foreground text-sm">{period}</p>
            </header>
            {children}
        </div>
    );
}

/** A titled block inside a report document. */
export function ReportSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <section className="space-y-3">
            <div className="space-y-1 border-b pb-2">
                <h3 className="text-primary text-sm font-bold tracking-wide uppercase">{title}</h3>
                {description && <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>}
            </div>
            {children}
        </section>
    );
}

export interface ReportAccount {
    id: number;
    kode_akun: string;
    nama_akun: string;
    saldo: number;
    saldo_last_year?: number;
}

interface AccountTableProps {
    accounts: ReportAccount[];
    currentYear: number;
    lastYear: number;
    emptyLabel: string;
    format: (value: number) => string;
}

/** Kode / Nama Akun / current year / prior year — the shared comparative account grid. */
export function AccountTable({ accounts, currentYear, lastYear, emptyLabel, format }: AccountTableProps) {
    return (
        <Table minWidth="min-w-[520px]">
            <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-32 px-0 sm:px-0">Kode</TableHead>
                    <TableHead className="px-2 sm:px-2">Nama Akun</TableHead>
                    <TableHead align="right" className="w-36 px-0 sm:px-0">
                        {currentYear}
                    </TableHead>
                    <TableHead align="right" className="w-36 px-0 sm:px-0">
                        {lastYear}
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {accounts.length === 0 ? (
                    <TableEmpty colSpan={4} className="py-6" description={emptyLabel} />
                ) : (
                    accounts.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground px-0 font-mono text-xs sm:px-0">{item.kode_akun}</TableCell>
                            <TableCell className="px-2 font-medium sm:px-2">{item.nama_akun}</TableCell>
                            <TableCell numeric className="text-foreground px-0 font-medium sm:px-0">
                                {format(item.saldo)}
                            </TableCell>
                            <TableCell numeric className="text-muted-foreground px-0 sm:px-0">
                                {format(item.saldo_last_year || 0)}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}

interface TotalRowProps {
    label: string;
    current: string;
    previous: string;
    currentYear: number;
    lastYear: number;
    /** `strong` is for a section's grand total; `default` for a sub-total. */
    emphasis?: 'default' | 'strong';
    className?: string;
    icon?: ReactNode;
}

/** Comparative total bar closing a report section. */
export function TotalRow({ label, current, previous, currentYear, lastYear, emphasis = 'default', className, icon }: TotalRowProps) {
    const strong = emphasis === 'strong';

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-4 rounded-lg border',
                strong ? 'bg-muted/40 border-t-2 p-4' : 'bg-muted/20 p-3',
                className,
            )}
        >
            <span className={cn('flex items-center gap-2 font-bold uppercase', strong ? 'text-sm' : 'text-xs')}>
                {icon}
                {label}
            </span>
            <div className="flex gap-6 text-right">
                <div>
                    <span className="text-muted-foreground block text-xs font-semibold">{currentYear}</span>
                    <span className={cn('font-mono font-bold tabular-nums', strong ? 'text-base' : 'text-sm')}>{current}</span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-xs font-semibold">{lastYear}</span>
                    <span className={cn('text-muted-foreground font-mono font-medium tabular-nums', strong ? 'text-base' : 'text-sm')}>
                        {previous}
                    </span>
                </div>
            </div>
        </div>
    );
}

/** Signature lines that only appear on paper. */
export function ReportSignatures() {
    return (
        <div className="mt-16 hidden justify-between text-center print:flex">
            <div className="w-48 border-t border-neutral-400 pt-2 text-sm text-neutral-500">
                Dibuat Oleh,
                <br />
                <br />
                <br />
                <br />( Staff Akunting )
            </div>
            <div className="w-48 border-t border-neutral-400 pt-2 text-sm text-neutral-500">
                Disetujui Oleh,
                <br />
                <br />
                <br />
                <br />( Pemilik Perusahaan )
            </div>
        </div>
    );
}

/** DD/MM/YYYY — the display format used across all reports. */
export function formatDateSlash(dateString: string) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
}

export function formatDateRange(start: string, end: string) {
    return `${formatDateSlash(start)} – ${formatDateSlash(end)}`;
}
