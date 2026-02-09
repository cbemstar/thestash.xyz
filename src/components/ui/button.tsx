'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { motion, AnimatePresence, type HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: 'h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': 'size-6 rounded-md [&_svg:not([class*="size-"])]:size-3',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const CURTAIN_TRANSITION = {
  duration: 0.4,
  ease: [0.19, 1, 0.22, 1] as const,
};

const curtainVariantStyles: Record<
  string,
  { button: string; curtain: string; textInitial: string; textHover: string }
> = {
  default: {
    button: 'bg-primary border border-primary text-primary-foreground',
    curtain: 'bg-primary-foreground',
    textInitial: 'text-primary-foreground',
    textHover: 'text-primary',
  },
  destructive: {
    button:
      'bg-destructive border border-destructive text-destructive-foreground',
    curtain: 'bg-destructive-foreground',
    textInitial: 'text-destructive-foreground',
    textHover: 'text-destructive',
  },
  outline: {
    button:
      'bg-background border border-input text-primary hover:border-primary',
    curtain: 'bg-primary',
    textInitial: 'text-primary',
    textHover: 'text-primary-foreground',
  },
  secondary: {
    button:
      'bg-secondary border border-secondary text-secondary-foreground',
    curtain: 'bg-secondary-foreground',
    textInitial: 'text-secondary-foreground',
    textHover: 'text-secondary',
  },
  ghost: {
    button: 'bg-transparent border border-transparent text-foreground',
    curtain: 'bg-accent',
    textInitial: 'text-foreground',
    textHover: 'text-accent-foreground',
  },
};

const curtainSizeStyles: Record<string, string> = {
  default: 'h-9 px-4 py-2',
  xs: 'h-6 rounded-md px-2 text-xs',
  sm: 'h-8 rounded-md px-3',
  lg: 'h-10 rounded-md px-6',
  icon: 'size-9',
  'icon-xs': 'size-6 rounded-md',
  'icon-sm': 'size-8',
  'icon-lg': 'size-10',
};

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      loading = false,
      children,
      onClick,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const isDisabled = disabled ?? false;
    const isBusy = loading || isDisabled;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isBusy) {
        e.preventDefault();
        return;
      }
      (onClick as React.MouseEventHandler<HTMLButtonElement>)?.(e);
    };

    if (asChild) {
      return (
        <Slot.Root
          data-slot="button"
          data-variant={variant}
          data-size={size}
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLButtonElement>}
          {...props}
        >
          {children}
        </Slot.Root>
      );
    }

    if (variant === 'link') {
      return (
        <button
          ref={ref}
          type="button"
          data-slot="button"
          data-variant={variant}
          data-size={size}
          className={cn(buttonVariants({ variant, size, className }))}
          onClick={onClick}
          disabled={disabled}
          {...props}
        >
          {children}
        </button>
      );
    }

    const v = variant ?? 'default';
    const s = size ?? 'default';
    const curtainStyle = curtainVariantStyles[v] ?? curtainVariantStyles.default;
    const sizeClass = curtainSizeStyles[s] ?? curtainSizeStyles.default;

    const isTextOnly =
      React.Children.count(children) === 1 &&
      (typeof children === 'string' || typeof children === 'number');
    const textContent = isTextOnly ? String(children) : '';

    return (
      <motion.button
        ref={ref}
        type="button"
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(
          'relative overflow-hidden rounded-md font-medium ring-offset-background transition-colors',
          'inline-flex items-center justify-center whitespace-nowrap text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isBusy && 'pointer-events-none opacity-50',
          curtainStyle.button,
          sizeClass,
          className
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        whileTap={!isBusy ? { scale: 0.98 } : undefined}
        disabled={isBusy}
        {...(props as HTMLMotionProps<'button'>)}
      >
        <motion.div
          className={cn('absolute inset-0 z-0', curtainStyle.curtain)}
          initial={{ y: '100%' }}
          animate={isHovered ? { y: 0 } : { y: '100%' }}
          transition={CURTAIN_TRANSITION}
        />

        <AnimatePresence mode="popLayout">
          {loading && (
            <motion.div
              key="loader"
              className="absolute inset-0 z-20 flex items-center justify-center"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={CURTAIN_TRANSITION}
            >
              <Loader2
                className={cn(
                  'h-4 w-4 animate-spin',
                  isHovered ? curtainStyle.textHover : curtainStyle.textInitial
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isTextOnly ? (
          <motion.div
            className="relative z-10 flex min-h-[1.25rem] flex-col items-center justify-center overflow-hidden"
            animate={
              loading ? { y: '-150%', opacity: 0 } : { y: 0, opacity: 1 }
            }
            transition={CURTAIN_TRANSITION}
          >
            <span className="invisible whitespace-nowrap opacity-0">
              {textContent}
            </span>
            <motion.div
              className="absolute left-0 right-0 top-0 flex flex-col items-center justify-center text-center"
              animate={isHovered ? { y: '-50%' } : { y: 0 }}
              transition={CURTAIN_TRANSITION}
            >
              <span
                className={cn(
                  'flex min-h-[1.25rem] items-center justify-center whitespace-nowrap',
                  curtainStyle.textInitial
                )}
              >
                {textContent}
              </span>
              <span
                className={cn(
                  'flex min-h-[1.25rem] items-center justify-center whitespace-nowrap',
                  curtainStyle.textHover
                )}
                aria-hidden
              >
                {textContent}
              </span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className={cn(
              'relative z-10 flex items-center justify-center gap-2',
              isHovered ? curtainStyle.textHover : curtainStyle.textInitial
            )}
            animate={
              loading ? { y: '-150%', opacity: 0 } : { y: 0, opacity: 1 }
            }
            transition={CURTAIN_TRANSITION}
          >
            {children}
          </motion.div>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
