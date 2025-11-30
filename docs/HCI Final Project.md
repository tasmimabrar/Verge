# PHASE 1: FRONTEND FOUNDATION (Build with Mock/Hardcoded Data)
**Goal**: Get dashboard looking and working perfectly with placeholder data

### ✅ Task 1: Shared UI Components (Build Reusable Pieces)
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: None
**Blocks**: Everything else

**Requirements**:
- [ ] Create `shared/components/Card/` component
  - Props: `children`, `title?`, `className?`, `variant?: 'default' | 'highlighted'`
  - CSS: Uses `--color-bg-surface`, `--shadow-sm`, rounded corners
  - Hover effect: subtle lift (`translateY(-2px)`)
- [ ] Create `shared/components/Badge/` component
  - Props: `children`, `variant: 'low' | 'medium' | 'high' | 'info' | 'success'`
  - Color-coded backgrounds (use CSS variables)
- [ ] Create `shared/components/Loader/` component
  - Props: `variant: 'global' | 'screen' | 'component' | 'skeleton'`, `count?: number`
  - Spinning animation for global/screen
  - Pulse animation for skeleton (list/card placeholders)
- [ ] Create `shared/components/EmptyState/` component
  - Props: `icon`, `title`, `description`, `action?`
  - Centered layout with icon, text, optional button

**Files Created**:
- `src/shared/components/Card/Card.tsx`
- `src/shared/components/Card/Card.module.css`
- `src/shared/components/Card/index.ts`
- (Same pattern for Badge, Loader, EmptyState)

---

### ⬜ Task 2: Dashboard Layout & Static Widgets
**Status**: Not Started
**Time**: 3-4 hours
**Dependencies**: Task 1 (needs Card, Badge components)
**Blocks**: Task 3

**Requirements**:
- [ ] Update `features/dashboard/Dashboard.tsx` with full layout:
  - Header section (Welcome message, current date)
  - 4 stat cards (Tasks Today, In Progress, Completed, Overdue)
  - "Today's Priorities" section (list of 3-5 tasks)
  - "Upcoming Deadlines" section (next 5 tasks by due date)
  - Quick actions panel (Add Task, New Project buttons - can be placeholders)
- [ ] Use **hardcoded data** for now:
  ```tsx
  const mockStats = {
    tasksToday: 5,
    inProgress: 3,
    completed: 12,
    overdue: 1
  };
  
  const mockTasks = [
    { id: '1', title: 'Finish risk assessment slide', priority: 'high', dueDate: 'Today', project: 'Cybersecurity' },
    { id: '2', title: 'Review pull requests', priority: 'medium', dueDate: 'Today', project: 'Verge' },
    // ... 3 more
  ];
  ```
- [ ] Style with CSS Grid for responsive layout (2 columns on desktop, 1 on mobile)
- [ ] Ensure all colors/spacing use CSS variables
- [ ] Add empty states (if no tasks, show EmptyState component)

**Design Requirements**:
- Clean, spacious layout (generous whitespace)
- Color-coded priority badges (red=high, yellow=medium, green=low)
- Hover effects on task cards
- Smooth transitions (200ms ease)

**Files Modified**:
- `src/features/dashboard/Dashboard.tsx`
- `src/features/dashboard/Dashboard.module.css`

---

### ⬜ Task 3: Dashboard Interactivity (Click Handlers)
**Status**: Not Started
**Time**: 1-2 hours
**Dependencies**: Task 2 (needs dashboard layout)
**Blocks**: Task 5 (routing)

**Requirements**:
- [ ] Add `onClick` handlers to task cards → Log to console: "Navigate to task: {id}"
- [ ] Add `onClick` to "Add Task" button → Log: "Open add task modal"
- [ ] Add `onClick` to "New Project" button → Log: "Open new project form"
- [ ] Add `onClick` to stat cards → Log: "Filter by: {status}"
- [ ] Add hover states to all interactive elements
- [ ] Add cursor: pointer to clickable items

**Testing**:
- [ ] Click each task → See console log
- [ ] Click each button → See console log
- [ ] Hover states work smoothly

**Files Modified**:
- `src/features/dashboard/Dashboard.tsx`
- `src/features/dashboard/Dashboard.module.css`

---

# PHASE 2: NAVIGATION & ROUTING (Connect Pages)
**Goal**: Make pages accessible and link them together

### ⬜ Task 4: Project List Page (Frontend Only)
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: Task 1 (needs Card component)
**Blocks**: Task 5 (routing)

**Requirements**:
- [ ] Create `features/projects/ProjectList.tsx`
- [ ] Create `features/projects/ProjectList.module.css`
- [ ] Use **hardcoded mock projects**:
  ```tsx
  const mockProjects = [
    { id: '1', name: 'Cybersecurity Group Project', dueDate: '2025-12-15', tasksCount: 8, completedCount: 3 },
    { id: '2', name: 'Personal Website Redesign', dueDate: '2025-12-20', tasksCount: 5, completedCount: 5 },
    // ... 2-3 more
  ];
  ```
- [ ] Display as grid of cards (2-3 columns)
- [ ] Each card shows: name, due date, progress bar, task count
- [ ] Add "New Project" button (placeholder)
- [ ] Click project card → Log to console: "Navigate to project: {id}"

**Design**:
- Consistent with dashboard (same Card component)
- Progress bars with color coding (green if >75%, yellow if 25-75%, red if <25%)

**Files Created**:
- `src/features/projects/ProjectList.tsx`
- `src/features/projects/ProjectList.module.css`
- `src/features/projects/index.ts`

---

### ⬜ Task 5: Setup React Router & Connect Pages
**Status**: Not Started
**Time**: 1-2 hours
**Dependencies**: Task 2 (dashboard), Task 3 (click handlers), Task 4 (project list)
**Blocks**: Task 6

**Requirements**:
- [ ] Update `src/App.tsx` to use React Router
- [ ] Define routes:
  ```tsx
  <Route path="/" element={<Dashboard />} />
  <Route path="/projects" element={<ProjectList />} />
  <Route path="/projects/:id" element={<div>Project Detail (TODO)</div>} />
  <Route path="/tasks/:id" element={<div>Task Detail (TODO)</div>} />
  ```
- [ ] Replace console.logs in Task 3 with `navigate('/tasks/1')` etc.
- [ ] Add navigation to dashboard (sidebar or top nav):
  - Links: Dashboard, Projects, Calendar (disabled for now), Settings (disabled)
- [ ] Test navigation works (clicking links changes URL and renders correct page)

**Files Modified**:
- `src/App.tsx`
- `src/features/dashboard/Dashboard.tsx` (replace console.logs with navigate)
- `src/features/projects/ProjectList.tsx` (add navigate on card click)

---

### ⬜ Task 6: Shared Navigation Component
**Status**: Not Started
**Time**: 2 hours
**Dependencies**: Task 5 (routing setup)
**Blocks**: Task 7

**Requirements**:
- [ ] Update `shared/components/Header/Header.tsx`:
  - Add navigation links (Dashboard, Projects, Calendar, Settings)
  - Highlight active route (use `useLocation` from react-router)
  - Responsive: hamburger menu on mobile, full nav on desktop
- [ ] Style with CSS variables
- [ ] Add smooth transitions for active indicator
- [ ] Ensure works on dashboard AND project list pages

**Files Modified**:
- `src/shared/components/Header/Header.tsx`
- `src/shared/components/Header/Header.module.css`

---

# PHASE 3: TASK MANAGEMENT (Core Feature - Frontend)
**Goal**: Build complete task CRUD with mock data

### ⬜ Task 7: Task Detail Page (View Only)
**Status**: Not Started
**Time**: 3-4 hours
**Dependencies**: Task 5 (routing), Task 6 (navigation)
**Blocks**: Task 8

**Requirements**:
- [ ] Create `features/tasks/TaskDetail.tsx`
- [ ] Use `useParams` to get task ID from URL
- [ ] **Hardcoded mock task data** (different data for each ID):
  ```tsx
  const mockTaskData = {
    '1': { id: '1', title: 'Finish risk assessment slide', description: '...', priority: 'high', ... },
    '2': { id: '2', title: 'Review pull requests', ... },
  };
  ```
- [ ] Display task info in clean layout:
  - Title (large heading)
  - Priority badge
  - Due date
  - Status selector (dropdown - disabled for now)
  - Description textarea (read-only for now)
  - Subtasks list (checkboxes - disabled for now)
  - Project link (clickable - goes to project page)
- [ ] Add "Edit" button (placeholder)
- [ ] Add "Delete" button (placeholder)
- [ ] Add "Back" button (navigate to previous page)

**Design**:
- Two-column layout on desktop (task details left, AI Assist panel right - empty for now)
- Single column on mobile (AI panel hidden)

**Files Created**:
- `src/features/tasks/TaskDetail.tsx`
- `src/features/tasks/TaskDetail.module.css`
- `src/features/tasks/index.ts`

---

### ⬜ Task 8: Task Edit Mode (Inline Editing)
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: Task 7 (task detail page)
**Blocks**: Task 9

**Requirements**:
- [ ] Add `isEditing` state to TaskDetail component
- [ ] "Edit" button toggles `isEditing` to true
- [ ] When editing:
  - Title becomes editable input
  - Description becomes editable textarea
  - Status dropdown becomes enabled
  - Subtasks become editable (add/remove/edit text)
  - Show "Save" and "Cancel" buttons
- [ ] "Save" button → Log changes to console, toggle `isEditing` to false
- [ ] "Cancel" button → Revert changes, toggle `isEditing` to false
- [ ] Add basic validation (title required, due date must be future)

**Files Modified**:
- `src/features/tasks/TaskDetail.tsx`
- `src/features/tasks/TaskDetail.module.css`

---

### ⬜ Task 9: Add Task Form (Modal or Slide-in)
**Status**: Not Started
**Time**: 3-4 hours
**Dependencies**: Task 8 (task editing patterns)
**Blocks**: None

**Requirements**:
- [ ] Create `shared/components/Modal/Modal.tsx` (reusable modal component)
- [ ] Create `features/tasks/components/AddTaskForm.tsx`
- [ ] Form fields:
  - Title (required)
  - Description (optional)
  - Due date (date picker)
  - Priority (dropdown: low, medium, high)
  - Project (dropdown - use mock project list from Task 4)
- [ ] "Add Task" button in dashboard/project list opens modal
- [ ] "Save Task" button → Log form data to console, close modal
- [ ] "Cancel" button → Close modal, clear form
- [ ] Form validation (title + due date required)

**Design**:
- Modal: centered, overlay background, smooth fade-in animation
- Focus trap (can't tab outside modal)
- Close on Esc key or overlay click

**Files Created**:
- `src/shared/components/Modal/Modal.tsx`
- `src/shared/components/Modal/Modal.module.css`
- `src/features/tasks/components/AddTaskForm.tsx`
- `src/features/tasks/components/AddTaskForm.module.css`

---

# PHASE 4: BACKEND INTEGRATION (Connect to Firebase)
**Goal**: Replace mock data with real Firebase data

### ⬜ Task 10: Setup Firebase & Auth (Already Done!)
**Status**: Complete ✅
**Time**: N/A
**Dependencies**: None
**Blocks**: Task 11

**Files**:
- `src/lib/firebase/config.ts` ✅
- `src/lib/firebase/auth.ts` ✅
- `src/shared/contexts/AuthContext.tsx` ✅

---

### ⬜ Task 11: Create TypeScript Data Models
**Status**: Not Started
**Time**: 30 minutes
**Dependencies**: None
**Blocks**: Task 12

**Requirements**:
- [ ] Create `src/shared/types/index.ts`
- [ ] Define interfaces:
  ```typescript
  export interface User {
    uid: string;
    email: string;
    displayName: string;
    settings: UserSettings;
  }
  
  export interface UserSettings {
    theme: 'light' | 'dark';
    aiEnabled: boolean;
    notificationsEnabled: boolean;
  }
  
  export interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Task {
    id: string;
    projectId: string;
    userId: string;
    title: string;
    notes?: string;
    dueDate: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in_progress' | 'done' | 'postponed';
    subtasks: Subtask[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
  }
  ```
- [ ] Add JSDoc comments explaining each field
- [ ] Export all types

**Files Created**:
- `src/shared/types/index.ts`

---

### ⬜ Task 12: Firestore Helper Functions
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: Task 11 (types)
**Blocks**: Task 13

**Requirements**:
- [ ] Create `src/lib/firebase/firestore.ts`
- [ ] Implement CRUD functions for tasks:
  ```typescript
  export const getTasks = async (userId: string): Promise<Task[]>
  export const getTask = async (taskId: string): Promise<Task | null>
  export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void>
  export const deleteTask = async (taskId: string): Promise<void>
  ```
- [ ] Implement CRUD functions for projects (same pattern)
- [ ] Add error handling (try/catch, throw custom errors)
- [ ] Add Firestore indexes if needed (composite queries)

**Testing**:
- [ ] Test in Firebase console (manually add a task, verify it appears)

**Files Created**:
- `src/lib/firebase/firestore.ts`

---

### ⬜ Task 13: Connect Dashboard to Firebase
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: Task 12 (Firestore helpers)
**Blocks**: Task 14

**Requirements**:
- [ ] Replace hardcoded `mockTasks` in Dashboard with real Firestore query
- [ ] Add loading state (show Loader while fetching)
- [ ] Add error state (show error message if fetch fails)
- [ ] Filter tasks by current user (`userId === auth.currentUser.uid`)
- [ ] Calculate stats from real data (tasksToday, inProgress, etc.)
- [ ] Update "Today's Priorities" to show real tasks sorted by priority
- [ ] Update "Upcoming Deadlines" to show real tasks sorted by due date

**Files Modified**:
- `src/features/dashboard/Dashboard.tsx`

**Testing**:
- [ ] Create tasks in Firestore console → See them appear on dashboard
- [ ] Stats should update automatically

---

### ⬜ Task 14: Connect Task CRUD to Firebase
**Status**: Not Started
**Time**: 3-4 hours
**Dependencies**: Task 12 (Firestore helpers), Task 13 (dashboard connected)
**Blocks**: None

**Requirements**:
- [ ] TaskDetail page: Fetch task from Firestore instead of mock data
- [ ] AddTaskForm: Create task in Firestore on submit
- [ ] TaskDetail edit mode: Update task in Firestore on save
- [ ] TaskDetail delete: Delete task from Firestore with confirmation modal
- [ ] Add optimistic updates (update UI immediately, sync to Firebase in background)
- [ ] Add error handling (show toast/banner on error)

**Files Modified**:
- `src/features/tasks/TaskDetail.tsx`
- `src/features/tasks/components/AddTaskForm.tsx`

**Testing**:
- [ ] Add task → Appears in dashboard immediately
- [ ] Edit task → Changes saved and visible across app
- [ ] Delete task → Removed from dashboard and Firebase

---

# PHASE 5: ADVANCED FEATURES
**Goal**: AI Assist, Calendar view, Settings

### ⬜ Task 15: AI Assist Panel UI
**Status**: Not Started
**Time**: 3-4 hours
**Dependencies**: Task 14 (task CRUD working)
**Blocks**: Task 16

**Requirements**:
- [ ] Add AI Assist panel to TaskDetail page (right column on desktop)
- [ ] "AI Assist" button triggers suggestions
- [ ] Display suggestions in panel:
  - "Suggested Subtasks" (3-5 items)
  - "Suggested Priority" (with reasoning)
  - "Time Estimate" for task
- [ ] Each suggestion has "Accept" and "Dismiss" buttons
- [ ] "Accept" → Apply suggestion to task form
- [ ] "Dismiss" → Remove suggestion from view
- [ ] Show loading spinner while "thinking"

**Design**:
- Panel slides in from right (smooth animation)
- Suggestions displayed as cards
- Green "Accept" button, gray "Dismiss" button
- Icon to indicate AI (brain or sparkle icon from react-icons)

**Files Modified**:
- `src/features/tasks/TaskDetail.tsx`
- `src/features/tasks/TaskDetail.module.css`
- Create `src/features/tasks/components/AIAssistPanel.tsx`

---

### ⬜ Task 16: AI Suggestion Logic (Simulated)
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: Task 15 (AI panel UI)
**Blocks**: None

**Requirements**:
- [ ] Create `src/shared/utils/aiSuggestions.ts`
- [ ] Implement heuristic-based suggestions:
  ```typescript
  export const generateSubtasks = (taskTitle: string): string[] => {
    // If title contains "research" → ["Gather sources", "Read articles", "Summarize findings"]
    // If title contains "write" → ["Create outline", "Write draft", "Edit and polish"]
    // Default → ["Plan approach", "Execute", "Review"]
  }
  
  export const suggestPriority = (task: Task): 'low' | 'medium' | 'high' => {
    // If due date < 3 days → 'high'
    // If due date < 7 days → 'medium'
    // Else → 'low'
  }
  
  export const estimateEffort = (subtasks: string[]): number => {
    // Return estimated minutes (e.g., subtasks.length * 30)
  }
  ```
- [ ] Connect to AI Assist panel
- [ ] Add "reasoning" text (e.g., "High priority because due in 2 days")

**Files Created**:
- `src/shared/utils/aiSuggestions.ts`

**Testing**:
- [ ] Create task "Research AI models" → Suggests relevant subtasks
- [ ] Change due date → Priority suggestion updates

---

### ⬜ Task 17: Calendar View
**Status**: Not Started
**Time**: 4-5 hours
**Dependencies**: Task 14 (task data from Firebase)
**Blocks**: None

**Requirements**:
- [ ] Create `features/calendar/CalendarView.tsx`
- [ ] Monthly calendar grid (7 columns for days of week)
- [ ] Color-coded dots on dates with tasks (by priority)
- [ ] Click date → Show tasks for that day in sidebar
- [ ] Navigation: Previous/Next month buttons
- [ ] "Today" button to jump to current date
- [ ] Responsive: Stack on mobile

**Libraries**:
- Use `date-fns` for date calculations (already installed)
- Build custom grid (don't use heavy calendar library for prototype)

**Files Created**:
- `src/features/calendar/CalendarView.tsx`
- `src/features/calendar/CalendarView.module.css`
- `src/features/calendar/index.ts`

---

### ⬜ Task 18: Settings Page
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: Task 14 (user settings in Firebase)
**Blocks**: None

**Requirements**:
- [ ] Create `features/settings/SettingsPage.tsx`
- [ ] Settings sections:
  - **Appearance**: Light/Dark mode toggle
  - **AI Assist**: Enable/disable toggle
  - **Notifications**: Enable/disable toggle (future feature)
  - **Account**: Display name, email, logout button
- [ ] Save settings to Firebase user document
- [ ] Apply theme change immediately (update CSS variable)

**Files Created**:
- `src/features/settings/SettingsPage.tsx`
- `src/features/settings/SettingsPage.module.css`
- `src/features/settings/index.ts`

---

# PHASE 6: POLISH & TESTING
**Goal**: Animations, error handling, accessibility, final testing

### ⬜ Task 19: Animations & Transitions
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: All UI tasks (1-18)
**Blocks**: None

**Requirements**:
- [ ] Add page transitions (fade in on route change)
- [ ] Add list item animations (stagger fade-in for task lists)
- [ ] Add hover animations (subtle lift on cards)
- [ ] Add loading skeletons (pulse animation for dashboard stats)
- [ ] Add modal animations (fade in overlay, slide in modal)
- [ ] Ensure all transitions are 200-300ms (smooth, not jarring)

**Files Modified**:
- Various `.module.css` files
- Create `src/shared/utils/animations.css` for reusable animations

---

### ⬜ Task 20: Error Handling & Validation
**Status**: Not Started
**Time**: 2-3 hours
**Dependencies**: Task 14 (Firebase connected)
**Blocks**: None

**Requirements**:
- [ ] Add form validation errors (show inline messages)
- [ ] Add Firebase error handling (show user-friendly messages)
- [ ] Add network error handling (show "Retry" button)
- [ ] Add empty states everywhere (no tasks, no projects, no search results)
- [ ] Add loading states for all async operations
- [ ] Test all error paths (invalid form, network failure, etc.)

**Files Modified**:
- All form components
- All pages with Firebase queries

---

### ⬜ Task 21: Accessibility Audit
**Status**: Not Started
**Time**: 2 hours
**Dependencies**: All UI tasks
**Blocks**: None

**Requirements**:
- [ ] Ensure all colors meet WCAG AA contrast ratios
- [ ] Add `aria-label` to icon buttons
- [ ] Add keyboard navigation (Tab, Enter, Esc work everywhere)
- [ ] Add focus indicators (visible outline on focus)
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Add skip links ("Skip to main content")

---

### ⬜ Task 22: Final Testing & Bug Fixes
**Status**: Not Started
**Time**: 3-4 hours
**Dependencies**: All previous tasks
**Blocks**: None

**Requirements**:
- [ ] Test entire app flow (signup → dashboard → create task → AI assist → calendar)
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Test in different browsers (Chrome, Firefox, Safari)
- [ ] Fix any bugs discovered
- [ ] Optimize performance (lazy load routes, memoize components)
- [ ] Record demo video (5 minutes showing Philip's storyboard flow)

---

## ✅ Summary: Frontend-First Strategy

**Phases**:
1. **Frontend Foundation** (Tasks 1-3) - Dashboard with static data
2. **Navigation & Routing** (Tasks 4-6) - Connect pages
3. **Task Management** (Tasks 7-9) - CRUD with mock data
4. **Backend Integration** (Tasks 10-14) - Connect to Firebase
5. **Advanced Features** (Tasks 15-18) - AI, Calendar, Settings
6. **Polish & Testing** (Tasks 19-22) - Final touches

**Key Principle**: Build the UI first with hardcoded data, make it look perfect, THEN connect Firebase. No backend blockers!