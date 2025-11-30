# Verge - Technical Architecture

**Quick reference for implementation decisions and patterns.**

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: CSS Modules with native CSS variables and nesting
- **Routing**: React Router v6
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **State**: Context API (AuthContext, ThemeContext)
- **Icons**: react-icons

## Folder Structure

```
src/
├── features/           # Feature modules (dashboard, projects, tasks, auth)
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Login.module.css
│   │   └── components/
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Dashboard.module.css
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── [feature]/
│
├── shared/             # Reusable across 2+ features
│   ├── components/     # Button, Input, Modal, Loader, etc.
│   ├── contexts/       # AuthContext, ThemeContext
│   ├── hooks/          # useAuth, useFirestore, useTheme
│   ├── utils/          # formatDate, validators, etc.
│   └── types/          # Common TypeScript types
│
├── lib/                # External integrations
│   └── firebase/
│       ├── config.ts   # Firebase initialization
│       ├── auth.ts     # Auth helpers
│       ├── firestore.ts
│       └── types.ts
│
├── router/             # Routing configuration
│   ├── AppRouter.tsx
│   └── routes.tsx
│
├── styles/             # Global design system
│   ├── variables.css   # CSS custom properties
│   ├── reset.css
│   └── globals.css
│
├── assets/             # Images, icons, fonts
├── App.tsx             # Root component (auth check)
└── main.tsx            # Entry point
```

## Component Pattern

**Every component has this structure:**
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css
└── index.ts
```

**Example**:
```tsx
// Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  children: ReactNode;
}

export const Button = ({ variant = 'primary', loading, children, ...props }: ButtonProps) => {
  const classes = [styles.button, styles[variant], loading && styles.loading]
    .filter(Boolean).join(' ');
  return <button className={classes} {...props}>{children}</button>;
};
```

```ts
// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

## Routing Strategy

**App.tsx** (root component):
```tsx
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { Loader } from '@/shared/components/Loader';
import { LoginScreen } from '@/features/auth/Login';
import { AppRouter } from '@/router/AppRouter';

function App() {
  const { isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <Loader variant="global" />;
  if (!isAuthenticated) return <LoginScreen />;
  
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
```

**Routes hierarchy**:
```
/login          → LoginScreen (no navigation UI)
/               → Dashboard (main screen with nav)
/projects       → Projects list
/projects/:id   → Project detail
/tasks/:id      → Task detail with AI Assist
/calendar       → Calendar view
/settings       → Settings
```

## Firebase Structure

**Collections**:
- `users/{userId}` - User profiles and settings
- `projects/{projectId}` - User projects
- `tasks/{taskId}` - Tasks linked to projects

**Data models**:
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  settings: { theme: 'light' | 'dark'; notifications: boolean };
  createdAt: Timestamp;
}

interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  dueDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Task {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  notes?: string;
  dueDate: Timestamp;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done' | 'postponed';
  subtasks?: string[];
  aiSuggestions?: { subtask: string; priority: string }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Security**: Firestore rules ensure users can only access their own data.

## Loading States

**Three levels**:
1. **Global**: Full-screen loader during app init
2. **Screen**: Per-screen loading (dashboard, projects)
3. **Component**: Inline loaders (buttons, forms)

**Loader component** (`shared/components/Loader/`):
```tsx
<Loader variant="global" />        // Full screen
<Loader variant="skeleton" />      // List skeleton
<Loader variant="component" />     // Inline spinner
```

## State Management

**Context API** (no Redux/Zustand):
- `AuthContext` - User authentication state
- `ThemeContext` - Light/dark mode toggle
- Local state for component-specific data

**Pattern**:
```tsx
// shared/contexts/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Firebase auth listener...
  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
};

// Usage in components
const { user, isLoading } = useAuth();
```

## Theming (Light/Dark Mode)

**CSS variables** in `styles/variables.css`:
```css
:root[data-theme="light"] {
  --color-bg-primary: #ffffff;
  --color-text-primary: #111827;
}

:root[data-theme="dark"] {
  --color-bg-primary: #1f2937;
  --color-text-primary: #f9fafb;
}
```

**Toggle implementation**:
```tsx
const { theme, toggleTheme } = useTheme();
// Sets data-theme attribute on <html>
```

## Path Aliases

Configured in `tsconfig.app.json` and `vite.config.ts`:
```tsx
import { Button } from '@/shared/components';
import { DashboardCard } from '@/features/dashboard/components';
import '@/styles/variables.css';
```

## Naming Conventions

- Components: `PascalCase.tsx` + `PascalCase.module.css`
- Hooks: `camelCase` with `use` prefix
- Utils: `camelCase.ts`
- Types: `PascalCase.types.ts`
- CSS classes: `camelCase`

## Design Principles

Always apply:
- Use CSS variables (never hardcode colors/spacing)
- Generous whitespace
- Clear visual hierarchy
- Consistent spacing (use spacing variables)
- Contrast ratios for accessibility
- Professional icons from react-icons

## Anti-Patterns

❌ Hardcoded colors: `background: '#3b82f6'`  
✅ Use variables: `background: var(--color-primary)`

❌ Relative imports: `'../../../shared/Button'`  
✅ Path aliases: `'@/shared/components'`

❌ Mixed imports: `import { ReactNode } from 'react'`  
✅ Type-only: `import type { ReactNode } from 'react'`

❌ Shared code in features folder  
✅ Use `features/` for feature-specific, `shared/` for reusable

## Development Workflow

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # TypeScript check + build
npm run lint     # ESLint
```

## Key Reference Files

- `.github/copilot-instructions.md` - Complete AI agent guide
- `DEVELOPMENT_GUIDE.md` - Team development guide
- `CSS_VARIABLES.md` - Design token reference
- `src/shared/components/Button/` - Example component
- `src/features/dashboard/components/DashboardCard.tsx` - Feature component example

---

**Last Updated**: November 28, 2025
