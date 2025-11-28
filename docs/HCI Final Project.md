## 0. Decide the Scope of the Prototype

You **don’t** need the full app – just a **small but important subset** of functionality, implemented well (your prof explicitly says this). Focus on the core flow you already designed:

- Dashboard with **today’s priorities + upcoming deadlines**
    

Creating a **new project workspace** via a simple form

Adding a task and using **AI Assist** to get suggestions + priorities

Switching to a **Calendar / Kanban view** to see tasks over time

If you implement that one end-to-end, you’re already prototyping:

- **Functionality** (task/project handling, AI assist behaviour)
    
- **Interaction design** (your HTA flows)
    

**Look & feel** (minimal dashboard, side AI panel, etc.)

---

## 1. Set Up the React Native + TypeScript Project

1. Use **Expo** (easiest for prototypes):
    
    - `npx create-expo-app verge --template expo-template-blank-typescript`
        
2. Install navigation:
    
    - `@react-navigation/native`, `@react-navigation/native-stack` (or tabs), plus required deps.
        
3. Set up basic navigation structure:
    
    - `DashboardScreen`
        
    - `ProjectScreen` (project details + task list)
        
    - `NewProjectScreen`
        
    - `TaskDetailScreen` (shows AI Assist panel)
        
    - Optional: `CalendarScreen` (or embed calendar view inside project)
        

Use a simple stack or tabs that roughly matches your sidebar items: **Home, Projects, Calendar, AI Assist, Settings** from your design.

---

## 2. Define Your Data Models (TypeScript)

Create basic types in `types.ts`:
```export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'postponed';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  notes?: string;
  dueDate: string; // ISO date
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  subtasks?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  collaborators?: string[];
}
```
Store them in React state (Context or simple `useState` in a top-level component).

You just need **local in-memory state**, not a real backend, because the assignment only asks for a convincing prototype.

---

## 3. Implement the Core Flows

### A. Dashboard Screen

Goal: Reflect your dashboard sketch – **Today’s Priorities**, **Upcoming Deadlines**, small calendar.

- Show:
    
    - A list of **today’s top tasks** (sorted by due date + priority).
        
    - A “Upcoming Deadlines” list.
        
    - A small monthly calendar (can be a simple grid or even just text for prototype).
        
- Add buttons:
    
    - “Go to Projects”
        
    - “Add Project”
        
- This screen should **immediately look calm and uncluttered** (few buttons, lots of whitespace) to support your “minimal cognitive load” goal.
    

### B. New Project Screen

Map directly from your HTA:

1. Fields: Project Title, Description, Due Date, optional “Add collaborators”.
    

2. “AI Setup Options” toggles can be present but non-functional or lightly simulated.
    
3. “Create Project” button:
    
    - Validates input.
        
    - Adds a `Project` to state and navigates to `ProjectScreen`.
        

Keep it **one simple form on one page**, showing you’ve reduced setup steps vs tools like ClickUp.

### C. Project Screen (Task List + Add Task)

- Show:
    
    - Project title, due date.
        
    - List of tasks grouped by status (`To Do`, `In Progress`, `Done`, `Postponed`) as per your functionality.
        

Actions:

- “Add Task” button → `TaskDetailScreen` in “create” mode.
    
- Tapping a task → `TaskDetailScreen` in “edit” mode.
    
- Maybe a simple drag-and-drop or tap buttons to move status (“Move to In Progress / Done”) to match your HTA.
    

### D. Task Detail Screen + AI Assist Panel

This is your **signature interaction**, matching your interface sketch and storyboard.

- Left side: Task fields – title, notes, due date, subtasks list.
    
- Right side or bottom sheet: **AI Assist panel** with:
    
    - “Suggested Subtasks”
        
    - “Suggested Priority”
        
    - Buttons: **Accept** / **Dismiss** as in your wireframe.
        

Implementation idea (without real AI):

- When user taps **“AI Assist”**:
    
    - Run a simple function that:
        
        - Suggests 2–3 subtasks based on keywords in title (even hardcoded is fine).
            
        - Chooses a priority based on how close the due date is.
            
- On **Accept**:
    
    - Add suggested subtasks & priority into the Task state.
        
- On **Dismiss**:
    
    - Hide suggestion.
        

In your report, you explain this is a **simulated AI behaviour** that prototypes the interaction pattern, not the actual model.

### E. Calendar / Kanban View

You don’t need full calendar logic; just enough to show concept:

- Either:
    
    - A **tab** or segmented control on `ProjectScreen` switching between **List / Calendar / Kanban**; or
        
    - A separate `CalendarScreen`.
        
- Calendar view:
    
    - Use a simple library (like `react-native-calendars`) or a dummy grid; render tasks as colored dots on their due dates.
        
- Kanban view:
    
    - Three columns (To Do, In Progress, Done) with cards.
        
    - Drag-and-drop is nice but optional; tapping buttons to move tasks is enough to show status change.
        

This gives you the **“Flexible Views”** requirement from your stakeholder needs.

---

## 4. Design Principles to Keep in Mind (Tie Back to Your Study)

While implementing, consciously reflect your design decisions:

1. **Minimal Cognitive Load**
    
    - Few elements per screen, lots of spacing, clear hierarchy (big headings, simple buttons).
        
    - Hide advanced options behind toggles or collapsible sections.
        

**Centralized Workspace**

- Dashboard really shows _everything important at a glance_: today’s priorities + upcoming deadlines.
    

**Optional AI Assistance**

- AI is **never auto-running**; user must tap “AI Assist” or similar.
    
- Suggestions come in a separate panel with Accept/Dismiss, exactly as you described.
    

**Smart Notifications (Prototype Version)**

- For mobile RN, you can **simulate** notifications:
    
    - For example, a “Reminder” banner at top when a task is overdue rather than real push notifications.
        
- Explain in your report that full notification system is out of scope but the **interaction concept** is shown.
    

**Personal Command Center Metaphor**

- Keep navigation simple and consistent so it feels like one “cockpit”: dashboard, views, AI co-pilot.
    

---

## 5. What to Put in the Part 3b Report

Your PDF needs:

1. **Description of the Prototype(s)**
    
    - What platform (React Native + TS).
        
    - Which flows are implemented (dashboard → create project → add task → AI Assist → view calendar).
        
    - What aspect each part is prototyping:
        
        - Dashboard: look & feel + centralized workspace.
            
        - New project flow: simplified interaction vs competitors.
            
        - Task + AI Assist: novel interaction pattern.
            
        - Calendar/Kanban: flexible views & progress tracking.
            
2. **Key Design Decisions**
    
    - Choosing minimal screens first to support Philip’s main pain points (fragmented tools, mental exhaustion).
        

- - Optional AI with explicit opt-in.
        
    - Simulated AI instead of real backend for speed and clarity.
        
    - Local data only; no login, to reduce complexity.
        
- **Limitations**
    
    - No real multi-user collaboration.
        
    - AI logic is heuristic, just enough to demonstrate interaction.
        
    - Data not persisted across app restarts (unless you want to add AsyncStorage).
        
- **YouTube Video**
    
    - 5-minute screen recording (Expo app on simulator/device):
        
        - Show opening dashboard, creating project, adding task, using AI Assist, switching views.
            
    - Narrate how each step addresses your research findings (mention cognitive overload, fragmented workflows, etc.).
        

---

## 6. Appendices

- Individual contribution report (who coded which screens, who designed flows, who made the video, etc.).
    
- Notes from meetings / planning sessions.