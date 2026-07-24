import * as React from 'react';

import { cn } from '@/lib/utils';

export type TableAlign = 'left' | 'center' | 'right';

const ALIGN_CLASS: Record<TableAlign, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
};

/** Horizontal cell rhythm shared by every header, body, and footer cell. */
const CELL_PADDING = 'px-3 py-2.5 sm:px-4 sm:py-3';

/**
 * Card shell for a page-level table. Clips the scroller so the rounded corners
 * and border stay intact no matter how wide the table grows.
 */
const TableContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-card w-full overflow-hidden rounded-xl border shadow-xs', className)} {...props} />
));
TableContainer.displayName = 'TableContainer';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    /** Tailwind min-width utility that triggers horizontal scrolling, e.g. `min-w-[1000px]`. */
    minWidth?: string;
    /** Extra classes for the scroll viewport (max-height for a sticky header, for instance). */
    wrapperClassName?: string;
}

/**
 * Renders its own scroll viewport so wide tables scroll horizontally instead of
 * stretching the page. Column widths stay aligned because header and body share
 * the same table element.
 */
const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, minWidth, wrapperClassName, ...props }, ref) => (
    <div className={cn('w-full overflow-x-auto', wrapperClassName)}>
        <table ref={ref} className={cn('w-full border-collapse text-left text-sm', minWidth, className)} {...props} />
    </div>
));
Table.displayName = 'Table';

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    /** Pins the header while the body scrolls. Needs a height-capped wrapper. */
    sticky?: boolean;
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ className, sticky, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-muted/50 print:bg-transparent', sticky && 'sticky top-0 z-10', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-border divide-y', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('bg-muted/50 text-foreground border-t font-semibold print:bg-transparent', className)} {...props} />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('hover:bg-muted/40 transition-colors print:hover:bg-transparent', className)} {...props} />
));
TableRow.displayName = 'TableRow';

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    align?: TableAlign;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className, align = 'left', ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            'text-muted-foreground border-b align-middle text-xs font-semibold tracking-wide whitespace-nowrap uppercase',
            CELL_PADDING,
            ALIGN_CLASS[align],
            className,
        )}
        {...props}
    />
));
TableHead.displayName = 'TableHead';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    align?: TableAlign;
    /** Right-aligns and applies tabular figures so amounts line up digit for digit. */
    numeric?: boolean;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className, align, numeric, ...props }, ref) => (
    <td
        ref={ref}
        className={cn(
            'align-middle',
            CELL_PADDING,
            numeric && 'font-mono tabular-nums whitespace-nowrap',
            ALIGN_CLASS[align ?? (numeric ? 'right' : 'left')],
            className,
        )}
        {...props}
    />
));
TableCell.displayName = 'TableCell';

interface TableEmptyProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    colSpan: number;
    icon?: React.ReactNode;
    title?: string;
    description?: string;
}

/** Consistent zero-state row so every table reads the same when it has no data. */
function TableEmpty({ colSpan, icon, title, description, className, children, ...props }: TableEmptyProps) {
    return (
        <tr>
            <td colSpan={colSpan} className={cn('text-muted-foreground px-4 py-12 text-center', className)} {...props}>
                {children ?? (
                    <div className="flex flex-col items-center gap-1">
                        {icon}
                        {title && <p className="text-foreground text-base font-semibold">{title}</p>}
                        {description && <p className="text-muted-foreground text-sm">{description}</p>}
                    </div>
                )}
            </td>
        </tr>
    );
}

export { Table, TableBody, TableCell, TableContainer, TableEmpty, TableFooter, TableHead, TableHeader, TableRow };
