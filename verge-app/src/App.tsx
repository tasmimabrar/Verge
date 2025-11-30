import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from '@/lib/react-query';
import { AuthProvider, ThemeProvider } from '@/shared/contexts';
import { ProtectedRoute, PublicRoute } from '@/router';
import { LandingPage } from '@/features/landing';
import { LoginPage } from '@/features/auth';
import { Dashboard } from '@/features/dashboard';
import { NewTask, TaskDetail, TasksList } from '@/features/tasks';
import { NewProject, ProjectDetail, ProjectsList } from '@/features/projects';

function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes - redirect to dashboard if authenticated */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute>
                    <TasksList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks/new" 
                element={
                  <ProtectedRoute>
                    <NewTask />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks/:id" 
                element={
                  <ProtectedRoute>
                    <TaskDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <ProjectsList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/new" 
                element={
                  <ProtectedRoute>
                    <NewProject />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:id" 
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all - redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
