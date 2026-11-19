import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      className={cn(
        'text-sm font-bold lowercase text-foreground peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
