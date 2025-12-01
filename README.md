# Verge

Verge is an AI-assisted productivity platform designed to help individuals and small teams organize tasks, deadlines, and projects with minimal cognitive load. Unlike traditional task management tools, Verge focuses on clean design, optional AI assistance, and a centralized workspace to reduce workflow fragmentation and mental fatigue.

## Features

- Centralized dashboard for today's priorities and upcoming deadlines
- Task management with subtasks, priorities, and drag-and-drop reordering
- Optional AI Assist panel for smart suggestions (never auto-applied)
- Calendar, Kanban, and List views for flexible organization
- Customizable notifications and workspace settings
- Modern, responsive UI with light/dark mode support

## Technology Stack

- Vite
- React
- TypeScript
- CSS Modules (with native CSS variables and nesting)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tasmimabrar/Verge.git
   cd Verge/verge-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Lint the codebase:**
   ```bash
   npm run lint
   ```

## Project Structure

```
verge-app/
├── src/
│   ├── features/           # Feature modules (dashboard, projects, tasks)
│   ├── shared/             # Reusable components, hooks, utils
│   ├── styles/             # Global CSS variables, resets, and utilities
│   ├── router/             # Routing configuration
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                 # Static files
├── package.json            # Project metadata and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.app.json       # TypeScript configuration
└── README.md               # Project documentation
```

## Coding Conventions

- **Feature-based folder structure:** All business logic, components, hooks, and utils for a feature are co-located.
- **CSS Modules:** Use native CSS variables and nesting. Avoid inline styles and hardcoded values.
- **TypeScript strictness:** Use type-only imports where required.
- **Path aliases:** Use `@/features`, `@/shared`, `@/styles`, etc. for clean imports.
- **Component pattern:** Each component has its own folder with `.tsx`, `.module.css`, and `index.ts`.

See `.github/copilot-instructions.md` and `DEVELOPMENT_GUIDE.md` for detailed guidelines.

## Contribution Guidelines

1. Fork the repository and create a new branch for your feature or fix.
2. Follow the established coding conventions and folder structure.
3. Document any new components or utilities in the appropriate index files.
4. Submit a pull request with a clear description of your changes.
5. Ensure your code passes linting and builds successfully.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue on GitHub or contact the maintainers directly.

## Group Members:
| Name | Student ID | GitHub URL|
| :------------------------:|:------------------------:|:--------------------------------------:|
| Abdellatif Osman |  |  |
| Brandon D'sa | 100926532 | [Brandon](https://github.com/brandonn14) |
| Joys James | 100866455 | [Joys](https://github.com/JoysJ) |
| Mohammad tasmim Abrar | 100820649 | [Mohammad](https://github.com/tasmimabrar) |
| Vithuran Kankatharan |  |  |
