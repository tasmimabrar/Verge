# Verge App - Development Guide

## 📁 Project Structure

```
verge-app/src/
├── features/              # Feature-based modules
│   └── dashboard/
│       ├── Dashboard.tsx  # Main screen component
│       ├── components/    # Feature-specific components
│       ├── hooks/        # Feature-specific hooks
│       └── utils/        # Feature-specific utilities
│
├── shared/               # Shared across features
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Reusable custom hooks
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
│
├── styles/             # Global styles
│   ├── variables.css   # CSS variables (colors, spacing, etc.)
│   ├── reset.css       # CSS reset
│   └── globals.css     # Global styles and utilities
│
├── router/             # Routing configuration
└── assets/             # Static assets (images, icons, fonts)
```

## 🎨 Styling with CSS Modules

### Why CSS Modules?

- ✅ **Clean JSX**: No long className strings like Tailwind
- ✅ **Scoped Styles**: No naming conflicts between components
- ✅ **Built-in**: No extra dependencies, works out of the box with Vite
- ✅ **Modern CSS**: Use nesting, variables, and all modern CSS features
- ✅ **LLM-Friendly**: Easier for AI tools to read and understand
- ✅ **Type-Safe**: TypeScript support for CSS Module imports

### Component Structure

Every component should follow this pattern:

```
ComponentName/
├── ComponentName.tsx         # Component logic
├── ComponentName.module.css  # Component styles
└── index.ts                 # Public exports
```

### Example Component

**Button.tsx**
```tsx
import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = ({ variant = 'primary', children, ...props }: ButtonProps) => {
  return (
    <button className={`${styles.button} ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
};
```

**Button.module.css**
```css
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-1px);
  }
}

.primary {
  background: var(--color-primary);
  color: var(--color-white);
  
  &:hover {
    background: var(--color-primary-hover);
  }
}
```

**index.ts**
```ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

## When to Use Features vs Shared

### Use `features/` when:
- Component is only used within that feature
- Logic is tightly coupled to the feature
- Contains business logic specific to the feature

### Use `shared/` when:
- Component is used in 2+ features
- Generic, reusable UI component (Button, Input, Modal)
- No business logic, just presentation

## 🔗 Path Aliases

Use clean imports with path aliases:

```tsx
// Good - Using path aliases
import { Button } from '@/shared/components';
import { DashboardCard } from '@/features/dashboard/components';
import '@/styles/variables.css';

// ❌ Avoid - Relative paths
import { Button } from '../../../shared/components/Button';
```

Available aliases:
- `@/*` → `src/*`
- `@/features/*` → `src/features/*`
- `@/shared/*` → `src/shared/*`
- `@/styles/*` → `src/styles/*`
- `@/router/*` → `src/router/*`
- `@/assets/*` → `src/assets/*`

## CSS Variables

All design tokens are available as CSS variables in `styles/variables.css`:

```css
/* Colors */
var(--color-primary)
var(--color-secondary)
var(--color-text-primary)
var(--color-bg-primary)

/* Spacing */
var(--spacing-xs)   /* 4px */
var(--spacing-sm)   /* 8px */
var(--spacing-md)   /* 16px */
var(--spacing-lg)   /* 24px */
var(--spacing-xl)   /* 32px */

/* Typography */
var(--font-size-sm)
var(--font-size-base)
var(--font-size-lg)
var(--font-weight-medium)

/* Borders */
var(--border-radius-sm)
var(--border-radius-md)
var(--border-radius-lg)

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)

/* Transitions */
var(--transition-fast)
var(--transition-base)
```

## Naming Conventions

### Files and Folders
- **Components**: `PascalCase` (e.g., `Button.tsx`, `DashboardCard.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useAuth.ts`, `useDashboard.ts`)
- **Utils**: `camelCase` (e.g., `formatDate.ts`, `validators.ts`)
- **Types**: `PascalCase` with `.types.ts` (e.g., `User.types.ts`)
- **Folders**: `lowercase` or `kebab-case` (e.g., `dashboard/`, `user-profile/`)
- **CSS Modules**: `ComponentName.module.css`

### Code
```tsx
// Component names: PascalCase
export const DashboardCard = () => { ... }

// Props interfaces: PascalCase + Props suffix
export interface DashboardCardProps { ... }

// Hooks: camelCase with 'use' prefix
export const useAuth = () => { ... }

// Utilities: camelCase
export const formatDate = () => { ... }

// Constants: UPPER_SNAKE_CASE
export const API_BASE_URL = '...'

// CSS classes: camelCase
.cardHeader { ... }
.primaryButton { ... }
```

## Getting Started

### 1. Install Dependencies
```bash
cd verge-app
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

# Creating a New Feature

1. **Create feature folder**:
   ```bash
   mkdir -p src/features/my-feature/components
   ```

2. **Create main component**:
   ```tsx
   // src/features/my-feature/MyFeature.tsx
   import styles from './MyFeature.module.css';
   
   export const MyFeature = () => {
     return <div className={styles.container}>My Feature</div>;
   };
   ```

3. **Create styles**:
   ```css
   /* src/features/my-feature/MyFeature.module.css */
   .container {
     padding: var(--spacing-lg);
   }
   ```

4. **Export from index**:
   ```ts
   // src/features/my-feature/index.ts
   export { MyFeature } from './MyFeature';
   ```

## Creating a Shared Component

1. **Create component folder**:
   ```bash
   mkdir -p src/shared/components/MyComponent
   ```

2. **Create component files**:
   - `MyComponent.tsx` (logic)
   - `MyComponent.module.css` (styles)
   - `index.ts` (exports)

3. **Export from shared/components/index.ts**:
   ```ts
   export { MyComponent } from './MyComponent';
   export type { MyComponentProps } from './MyComponent';
   ```

## Best Practices

### 1. Keep Styles Co-located
- Each component has its own CSS module
- Styles live next to the component they style
- Easy to find and modify

### 2. Use CSS Variables
- Always use CSS variables for colors, spacing, etc.
- Ensures consistency across the app
- Easy to theme later

### 3. Modern CSS Nesting
```css
.card {
  padding: var(--spacing-md);
  
  /* Nested selectors */
  & .title {
    font-size: var(--font-size-lg);
  }
  
  /* Nested pseudo-classes */
  &:hover {
    box-shadow: var(--shadow-md);
  }
  
  /* Nested modifiers */
  &.active {
    border-color: var(--color-primary);
  }
}
```

### 4. Conditional Classes
```tsx
const classes = [
  styles.button,
  variant && styles[variant],
  size && styles[size],
  fullWidth && styles.fullWidth,
  className,
].filter(Boolean).join(' ');
```

### 5. Type Safety
```tsx
// Always use type-only imports for types
import type { ReactNode } from 'react';

// Define prop interfaces
export interface ComponentProps {
  title: string;
  onClick?: () => void;
}
```

## Team Collaboration

### Before Starting Work
1. Check existing components in `shared/components/`
2. Check if feature already exists in `features/`
3. Discuss with team if unsure where to put code

### Code Review Checklist
- [ ] Component has proper TypeScript types
- [ ] Styles use CSS variables
- [ ] Component is in correct folder (shared vs features)
- [ ] Exports added to index.ts
- [ ] No hardcoded colors/spacing (use variables)
- [ ] Component is responsive

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Modern CSS](https://moderncss.dev/)

## Troubleshooting

### Path Aliases Not Working
1. Restart VS Code
2. Run `npm install`
3. Check `tsconfig.app.json` and `vite.config.ts`

### CSS Module Not Found
1. Ensure file ends with `.module.css`
2. Check import path
3. Restart dev server

### TypeScript Errors
1. Check type imports use `import type { ... }`
2. Run `npm run build` to see all errors
3. Check tsconfig settings

## Need Help?

If you encounter issues:
1. Check this guide
2. Look at example components (Button, DashboardCard)
3. Ask in the group chat
