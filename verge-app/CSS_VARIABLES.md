# CSS Variables Quick Reference

Quick reference for all available CSS variables for our framework.

## Colors

### Primary & Secondary
```css
var(--color-primary)           /* #3b82f6 */
var(--color-primary-hover)     /* #2563eb */
var(--color-primary-light)     /* #dbeafe */

var(--color-secondary)         /* #8b5cf6 */
var(--color-secondary-hover)   /* #7c3aed */
var(--color-secondary-light)   /* #ede9fe */
```

### Background Colors
```css
var(--color-bg-primary)        /* #ffffff */
var(--color-bg-secondary)      /* #f9fafb */
var(--color-bg-tertiary)       /* #f3f4f6 */
```

### Text Colors
```css
var(--color-text-primary)      /* #111827 */
var(--color-text-secondary)    /* #6b7280 */
var(--color-text-tertiary)     /* #9ca3af */
var(--color-text-disabled)     /* #d1d5db */
```

### Border Colors
```css
var(--color-border)            /* #e5e7eb */
var(--color-border-light)      /* #f3f4f6 */
var(--color-border-dark)       /* #d1d5db */
```

### Status Colors
```css
var(--color-success)           /* #10b981 */
var(--color-success-light)     /* #d1fae5 */

var(--color-warning)           /* #f59e0b */
var(--color-warning-light)     /* #fef3c7 */

var(--color-error)             /* #ef4444 */
var(--color-error-light)       /* #fee2e2 */

var(--color-info)              /* #3b82f6 */
var(--color-info-light)        /* #dbeafe */
```

## Spacing

```css
var(--spacing-xs)    /* 4px */
var(--spacing-sm)    /* 8px */
var(--spacing-md)    /* 16px */
var(--spacing-lg)    /* 24px */
var(--spacing-xl)    /* 32px */
var(--spacing-2xl)   /* 48px */
var(--spacing-3xl)   /* 64px */
var(--spacing-4xl)   /* 96px */
```

## Typography

### Font Sizes
```css
var(--font-size-xs)      /* 12px */
var(--font-size-sm)      /* 14px */
var(--font-size-base)    /* 16px */
var(--font-size-lg)      /* 18px */
var(--font-size-xl)      /* 20px */
var(--font-size-2xl)     /* 24px */
var(--font-size-3xl)     /* 30px */
var(--font-size-4xl)     /* 36px */
var(--font-size-5xl)     /* 48px */
```

### Font Weights
```css
var(--font-weight-normal)      /* 400 */
var(--font-weight-medium)      /* 500 */
var(--font-weight-semibold)    /* 600 */
var(--font-weight-bold)        /* 700 */
```

### Line Heights
```css
var(--line-height-tight)       /* 1.25 */
var(--line-height-normal)      /* 1.5 */
var(--line-height-relaxed)     /* 1.75 */
```

## Borders

### Border Radius
```css
var(--border-radius-sm)        /* 4px */
var(--border-radius-md)        /* 8px */
var(--border-radius-lg)        /* 12px */
var(--border-radius-xl)        /* 16px */
var(--border-radius-2xl)       /* 24px */
var(--border-radius-full)      /* 9999px */
```

### Border Width
```css
var(--border-width)            /* 1px */
var(--border-width-thick)      /* 2px */
```

## Shadows

```css
var(--shadow-xs)      /* Subtle shadow */
var(--shadow-sm)      /* Small shadow */
var(--shadow-md)      /* Medium shadow */
var(--shadow-lg)      /* Large shadow */
var(--shadow-xl)      /* Extra large shadow */
var(--shadow-2xl)     /* 2X large shadow */
var(--shadow-inner)   /* Inner shadow */
```

## Transitions

```css
var(--transition-fast)         /* 150ms ease-in-out */
var(--transition-base)         /* 200ms ease-in-out */
var(--transition-slow)         /* 300ms ease-in-out */
var(--transition-slower)       /* 500ms ease-in-out */
```

## Z-Index

```css
var(--z-index-dropdown)        /* 1000 */
var(--z-index-sticky)          /* 1020 */
var(--z-index-fixed)           /* 1030 */
var(--z-index-modal-backdrop)  /* 1040 */
var(--z-index-modal)           /* 1050 */
var(--z-index-popover)         /* 1060 */
var(--z-index-tooltip)         /* 1070 */
```

## Breakpoints (for reference)

```css
var(--breakpoint-sm)    /* 640px */
var(--breakpoint-md)    /* 768px */
var(--breakpoint-lg)    /* 1024px */
var(--breakpoint-xl)    /* 1280px */
var(--breakpoint-2xl)   /* 1536px */
```

Use in media queries:
```css
@media (max-width: 768px) {
  /* Mobile styles */
}
```

## Layout

```css
var(--max-width-sm)     /* 640px */
var(--max-width-md)     /* 768px */
var(--max-width-lg)     /* 1024px */
var(--max-width-xl)     /* 1280px */
var(--max-width-2xl)    /* 1536px */

var(--container-padding)  /* var(--spacing-md) */
```

## Usage Examples

### Button
```css
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  
  &:hover {
    background: var(--color-primary-hover);
    box-shadow: var(--shadow-md);
  }
}
```

### Card
```css
.card {
  background: var(--color-bg-primary);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  
  & .title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
  }
}
```

### Input
```css
.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  transition: border-color var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
  }
}
```

---

**Pro Tip**: Use VS Code's IntelliSense to see all available variables as you type.
