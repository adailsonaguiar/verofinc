import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || '/';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:block">
          <div className="font-display text-3xl tracking-wide text-navy-900">
            Vero Finc
          </div>
          <div className="text-xs text-navy-500 tracking-widest uppercase mt-1">
            Controle Financeiro
          </div>

          <h1 className="font-display text-4xl mt-10 text-navy-900 leading-tight">
            Acesse sua plataforma financeira com segurança
          </h1>
          <p className="mt-4 text-navy-500 leading-relaxed">
            Faça login para visualizar indicadores, controlar receitas e
            despesas e manter seu fluxo de caixa em dia.
          </p>

          <div className="mt-8 space-y-3">
            <div className="card p-4 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-gold-500 mt-2 shrink-0" />
              <div>
                <p className="text-sm text-navy-900">Insights em tempo real</p>
                <p className="text-xs text-navy-500 mt-0.5">
                  Dashboards claros para decisões rápidas.
                </p>
              </div>
            </div>
            <div className="card p-4 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-gold-500 mt-2 shrink-0" />
              <div>
                <p className="text-sm text-navy-900">Controle centralizado</p>
                <p className="text-xs text-navy-500 mt-0.5">
                  Categorias, contas e cartões em um só lugar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <div className="lg:hidden mb-8">
            <div className="font-display text-2xl text-navy-900">Vero Finc</div>
            <div className="text-xs text-navy-500 tracking-widest uppercase mt-1">
              Controle Financeiro
            </div>
          </div>

          <h2 className="font-display text-2xl text-navy-900">Entrar</h2>
          <p className="text-sm text-navy-500 mt-1">
            Use seu email e senha para continuar
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-bone-border bg-white px-3 focus-within:border-navy-700 focus-within:ring-1 focus-within:ring-navy-700">
                <Mail className="w-4 h-4 text-navy-300 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                  className="w-full bg-transparent py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-300"
                />
              </div>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="flex items-center gap-2 rounded-lg border border-bone-border bg-white px-3 focus-within:border-navy-700 focus-within:ring-1 focus-within:ring-navy-700">
                <Lock className="w-4 h-4 text-navy-300 shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-300"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-xs text-navy-500">
            Ao continuar, você concorda com os termos de uso da plataforma.
          </div>
        </div>
      </div>
    </div>
  );
};
