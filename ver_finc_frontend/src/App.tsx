import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from 'react-router-dom';
import { TransactionsPage } from './pages/TransactionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import './index.css';
import { CreditCardsPage } from './pages/CreditCardsPage';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './contexts/AuthContext';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const AppLayout = () => (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 pt-20 lg:pt-0">
        <MobileHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Vero Finc"
        />

        {!isOnline && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs font-semibold py-2 px-4 shrink-0">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>Sem conexão — exibindo dados salvos localmente</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/credit-cards" element={<CreditCardsPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
