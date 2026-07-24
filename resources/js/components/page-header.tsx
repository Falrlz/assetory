import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: ReactNode;
    /** Buttons or controls pinned to the trailing edge on wider screens. */
    actions?: ReactNode;
    className?: string;
}

/**
 * The single title block every application page opens with. Keeps heading size,
 * description tone, and action alignment identical from Dashboard to Reports.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6', className)}>
            <div className="min-w-0 space-y-1">
                <h1 className="text-foreground text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

interface SectionHeadingProps {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

/** Heading for a block inside a page — one step down from `PageHeader`. */
export function SectionHeading({ title, description, actions, className }: SectionHeadingProps) {
    return (
        <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6', className)}>
            <div className="min-w-0 space-y-1">
                <h2 className="text-foreground text-lg font-semibold tracking-tight">{title}</h2>
                {description && <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

/**
 * Outermost wrapper for a page body: one page padding value and one gap value,
 * applied everywhere so sections never drift out of rhythm between screens.
 *
 * `overflow-x-clip` keeps a stray wide child from scrolling the whole window;
 * tables stay scrollable because each one owns its own scroll viewport. `clip`
 * rather than `hidden` on purpose — `hidden` would make `overflow-y` compute to
 * `auto`, turning this into a scroll container and breaking sticky descendants.
 */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex h-full w-full max-w-full min-w-0 flex-1 flex-col gap-6 overflow-x-clip p-4 sm:p-6', className)}>{children}</div>;
}

/**
 * Card that holds a page's filter/search controls above a table.
 *
 * `[&>*]:min-w-0` is load-bearing: grid items default to `min-width: auto`, so a
 * track would otherwise refuse to shrink below an input's intrinsic width or a
 * select's longest option. Because Tailwind breakpoints track the viewport while
 * the content area is a sidebar narrower, that overflow shows up as the whole
 * page scrolling sideways instead of the control simply getting narrower.
 */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('bg-card grid grid-cols-1 items-end gap-4 rounded-xl border p-4 shadow-xs [&>*]:min-w-0', className)}>{children}</div>;
}

/** Label + control pairing with a fixed vertical gap. */
export function Field({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('grid min-w-0 gap-2', className)}>{children}</div>;
}
