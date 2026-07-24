import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { controlBaseClass, controlSizeClass, type ControlSize } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface NativeSelectProps extends Omit<React.ComponentProps<'select'>, 'size'> {
    selectSize?: ControlSize;
    /** Classes for the positioning wrapper rather than the control itself. */
    wrapperClassName?: string;
}

/**
 * A plain `<select>` styled exactly like `Input`, so filter bars and dialogs can
 * mix inputs, selects, and date pickers without any height or border mismatch.
 * Native rendering keeps `<optgroup>` support, which the Radix select lacks.
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
    ({ className, wrapperClassName, selectSize = 'default', children, ...props }, ref) => (
        <div className={cn('relative w-full', wrapperClassName)}>
            <select
                ref={ref}
                className={cn(controlBaseClass, controlSizeClass[selectSize], 'cursor-pointer appearance-none pr-9', className)}
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden="true" />
        </div>
    ),
);

NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
