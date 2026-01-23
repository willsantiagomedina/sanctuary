import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      display: 'font-display text-4xl sm:text-5xl font-semibold leading-tight tracking-tight',
      h1: 'font-display text-3xl sm:text-4xl font-semibold leading-tight tracking-tight',
      h2: 'font-display text-2xl font-semibold leading-tight',
      h3: 'font-display text-xl font-semibold leading-snug',
      h4: 'font-display text-lg font-semibold leading-snug',
      subtitle: 'text-lg leading-relaxed text-muted-foreground',
      body: 'text-base leading-relaxed',
      muted: 'text-sm text-muted-foreground leading-relaxed',
      small: 'text-sm leading-relaxed',
      caption: 'text-xs text-muted-foreground leading-relaxed',
      label: 'text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground',
      eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground',
      code: 'font-mono text-sm',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    variant: 'body',
    align: 'left',
  },
});

type TextProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    as?: React.ElementType;
    asChild?: boolean;
  };

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as, asChild, className, variant, align, weight, ...props }, ref) => {
    const Comp: React.ElementType = asChild ? Slot : as || 'p';

    return (
      <Comp
        ref={ref}
        className={cn(textVariants({ variant, align, weight }), className)}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';

type HeadingProps = Omit<TextProps, 'variant' | 'as'> & {
  level?: 1 | 2 | 3 | 4;
};

const headingMap = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
} as const;

const Heading = React.forwardRef<HTMLElement, HeadingProps>(
  ({ level = 1, className, ...props }, ref) => {
    const variant = headingMap[level];
    const Tag = `h${level}` as const;

    return (
      <Text
        ref={ref}
        as={Tag}
        variant={variant}
        className={cn('tracking-tight', className)}
        {...props}
      />
    );
  }
);
Heading.displayName = 'Heading';

export { Text, Heading, textVariants };
