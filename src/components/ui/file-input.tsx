import { cn } from '@/lib/utils';
import * as React from 'react';
import { Input, InputProps } from './input';

export interface FileInputProps extends Omit<InputProps, 'type' | 'value'> {
  accept?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, accept, ...props }, ref) => {
    return (
      <Input
        type="file"
        accept={accept}
        className={cn(
          'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

FileInput.displayName = 'FileInput';

export { FileInput };
