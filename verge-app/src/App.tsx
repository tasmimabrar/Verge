import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/features/landing';
import { LoginPage } from '@/features/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* TODO: Add protected dashboard route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
