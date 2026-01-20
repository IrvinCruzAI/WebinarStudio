import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HistoryIcon } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { JobProvider, useJobContext } from './context/JobContext';
import { V1App } from './webinarrev_v1';
import './App.css';

const V1_ENABLED = import.meta.env.VITE_WEBINARREV_V1_ENABLED === 'true';

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeJob, setActiveJob } = useJobContext();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && activeJob) {
      setActiveJob(null);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <MainContent />
      </div>

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 md:hidden bg-teal-600 hover:bg-teal-700 text-white rounded-full p-3 shadow-lg z-10"
      >
        <HistoryIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

function App() {
  if (V1_ENABLED) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<V1App />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <JobProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </JobProvider>
  );
}

export default App;
