import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Global styles - Import order matters!
import '@/styles/reset.css'
import '@/styles/variables.css'
import '@/styles/globals.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
