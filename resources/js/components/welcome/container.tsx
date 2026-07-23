import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ContainerProps {
    children: ReactNode;
    className?: string;
}

/** Shared horizontal rhythm for every landing section. */
export function Container({ children, className }: ContainerProps) {
    return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

interface SectionProps {
    id?: string;
    children: ReactNode;
    className?: string;
}

/**
 * Every landing section fills the viewport left over by the 4rem sticky header.
 * `min-h` rather than `h`, so sections that outgrow a short screen keep flowing
 * instead of clipping.
 */
export function Section({ id, children, className }: SectionProps) {
    return (
        <section
            id={id}
            className={cn(
                'flex xl:min-h-[calc(100svh-4rem)] scroll-mt-16 items-center border-b border-neutral-200 py-12 sm:py-16 xl:py-6 dark:border-neutral-800',
                className,
            )}
        >
            <Container>{children}</Container>
        </section>
    );
}

interface SectionHeadingProps {
    eyebrow: string;
    title: string;
    description: string;
    align?: 'left' | 'center';
    className?: string;
}

export function SectionHeading({ eyebrow, title, description, align = 'center', className }: SectionHeadingProps) {
    return (
        <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
            <Badge variant="secondary" className="font-medium tracking-wide uppercase">
                {eyebrow}
            </Badge>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl dark:text-white">{title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">{description}</p>
        </div>
    );
}
