# Verge

**AI-Driven Productivity Platform** - Reduce cognitive overload through clean design and optional AI assistance.

**Status**: Production-Ready MVP | **Next Phase**: Feature Enhancements

---

## What is Verge?

Verge is a modern productivity platform that helps you manage tasks, projects, and deadlines without the mental fatigue of fragmented tools. Built with professional UX principles and powered by Firebase + React Query.

**Core Principle**: AI suggests, you decide. (Accept/Dismiss pattern, never auto-apply)

---

## Features

**Current (Production)**:
- ✅ Centralized dashboard with stats & widgets
- ✅ Full task management (CRUD, subtasks, AI Assist)
- ✅ Project organization
- ✅ Kanban board with drag-and-drop
- ✅ Calendar view
- ✅ Analytics with charts
- ✅ Smart notifications with filters
- ✅ Search functionality
- ✅ Dark/light themes
- ✅ Responsive design

**Coming Soon**:
- Custom views & saved filters
- Dashboard widget customization
- PWA (installable app)
- Time tracking & Pomodoro
- Gamification & achievements
- Advanced AI insights

---

## Quick Start (5 Minutes)

### 1. Installation

```bash
git clone https://github.com/tasmimabrar/Verge.git
cd Verge/verge-app
npm install
```

### 2. Firebase Setup

1. Copy `.env.local.example` to `.env.local`
2. Add your Firebase credentials from Firebase Console
3. Enable Authentication (Email/Password + Google) in Firebase

### 3. Run Development Server

```bash
npm run dev
# → http://localhost:5173
```

### 4. Build for Production

```bash
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build
```

---

## ️ Tech Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Styling**: CSS Modules (NOT Tailwind - optimized for AI token efficiency)
- **Backend**: Firebase (Auth + Firestore)
- **State**: React Query v5 (server) + Context API (client)
- **Libraries**: React Hook Form, date-fns, @dnd-kit, Recharts, Sonner, react-icons

**Why These Choices?** See `ARCHITECTURE.md` for detailed rationale.

---

## Project Structure

```
verge-app/
├── src/
│   ├── features/           # Feature modules (dashboard, tasks, projects, kanban, etc.)
│   │   └── [feature]/
│   │       ├── Feature.tsx
│   │       ├── Feature.module.css
│   │       └── components/  # Feature-specific components
│   ├── shared/             # Reusable across 2+ features
│   │   ├── components/     # 22+ UI components (Button, Card, Modal, etc.)
│   │   ├── hooks/          # React Query hooks (useTasks, useProjects, etc.)
│   │   ├── services/       # AI, notifications
│   │   ├── contexts/       # Auth, Theme
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helpers
│   ├── lib/                # External integrations
│   │   ├── firebase/       # Firebase config & helpers
│   │   └── react-query/    # Query client & centralized keys
│   ├── router/             # Route protection & config
│   ├── styles/             # CSS variables (dark/light themes)
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── docs/                   # Comprehensive documentation
│   ├── QUICK_START.md      # ← Start here
│   ├── SPRINT_CHECKLIST.md # ← Active tasks
│   └── ...
└── .github/
    └── copilot-instructions.md  # ← Complete architecture guide
```

**Pattern**: Feature-based structure (NOT type-based) for better co-location and team scalability.

---

## Code Quality

### Strict Rules (ALWAYS Follow)

1. ✅ **Type-only imports**: `import type { FC } from 'react'`
2. ✅ **Path aliases**: `@/shared/components` NOT `'../../../shared'`
3. ✅ **CSS variables**: `var(--color-primary)` NOT `#3b82f6`
4. ✅ **React Query for Firebase**: NEVER direct queries in components
5. ✅ **Component pattern**: `.tsx` + `.module.css` + `index.ts`

### Component Example

```
Button/
├── Button.tsx
├── Button.module.css
└── index.ts
```

```tsx
// Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export const Button = ({ variant = 'primary', ...props }: ButtonProps) => (
  <button className={`${styles.button} ${styles[variant]}`} {...props} />
);


---

## Next Sprint

Custom Views & Saved Filters

---

## 🚦 Development Workflow

1. **Create Feature Branch** → `git checkout -b feature/name`
2. **Follow Patterns** → Component structure, React Query, CSS variables
3. **Test Locally** → `npm run dev`
4. **Check Build** → `npm run build` (zero errors required)
5. **Commit** → Clear, descriptive messages

---

## Contributing

1. Fork & create feature branch
2. Follow established patterns
3. Ensure `npm run build` passes with zero errors
4. Update relevant documentation
5. Submit PR with clear description

**Code Review Checklist**:
- [ ] Type-only imports used
- [ ] Path aliases used (no relative paths)
- [ ] CSS variables used (no hardcoded values)
- [ ] React Query used for data fetching
- [ ] Component pattern followed
- [ ] TypeScript strict mode passes
- [ ] Documentation updated

---

## Project Stats

- **Status**: Production-ready MVP
- **Components**: 22+ shared, 15+ feature-specific
- **TypeScript**: Strict mode, zero errors
- **Test Coverage**: Manual testing complete
- **Deployment**: Vercel-ready

---

## Support

- **Issues**: Open GitHub issue with reproduction steps

---

## License

MIT License - See LICENSE file for details

---

**Ready to build?**
