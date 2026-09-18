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
import { Header } from './components/Header';
import './index.css';
import { CreditCardsPage } from './pages/CreditCardsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';

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
    <div className="min-h-screen flex bg-bone text-navy-900">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {!isOnline && (
          <div className="flex items-center justify-center gap-2 bg-gold-400/15 border-b border-gold-400/40 text-gold-600 text-xs font-medium py-2 px-4 shrink-0">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>Sem conexão — exibindo dados salvos localmente</span>
          </div>
        )}

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );

  return (
    <Router>
      <ToastContainer position="bottom-right" theme="dark" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
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
