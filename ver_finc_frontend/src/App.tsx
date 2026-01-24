import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TransactionsPage } from './pages/TransactionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountsPage } from './pages/AccountsPage';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import './index.css';
import { CreditCardsPage } from './pages/CreditCardsPage';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Mobile Header */}
          <MobileHeader
            onMenuClick={() => setIsSidebarOpen(true)}
            title="Vero Finc"
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/credit-cards" element={<CreditCardsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

