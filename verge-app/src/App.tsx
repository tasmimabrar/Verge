import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/features/landing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* TODO: Add /login route */}
        {/* TODO: Add /dashboard route (protected) */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
