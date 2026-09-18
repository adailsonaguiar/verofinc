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
import { Menu } from './components/Menu';
import { Header } from './components/Header';
import { BottomBar } from './components/BottomBar';
import './index.css';
import { CreditCardsPage } from './pages/CreditCardsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-bone text-navy-900">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex min-h-screen flex-col">
        <Header onMenuClick={() => setIsMenuOpen(true)} />

        {!isOnline && (
          <div className="flex shrink-0 items-center justify-center gap-2 border-b border-gold-400/30 bg-gold-400/10 px-4 py-2 text-xs font-medium text-gold-600">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Sem conexão — exibindo dados salvos localmente</span>
          </div>
        )}

        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>

        <BottomBar onMenuClick={() => setIsMenuOpen(true)} />
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
