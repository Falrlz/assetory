import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Every form control in the app — input, native select, date picker — shares
 * this base so borders, focus rings, and disabled states never drift apart.
 */
export const controlBaseClass =
    'flex w-full min-w-0 rounded-md border border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export type ControlSize = 'default' | 'sm';

/** `default` matches Button `default` (h-10); `sm` matches Button `sm` (h-9). */
export const controlSizeClass: Record<ControlSize, string> = {
    default: 'h-10 px-3 py-2 text-base md:text-sm',
    sm: 'h-9 px-3 py-1.5 text-sm',
};

export interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
    inputSize?: ControlSize;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, inputSize = 'default', ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                controlBaseClass,
                controlSizeClass[inputSize],
                'file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export { Input };
