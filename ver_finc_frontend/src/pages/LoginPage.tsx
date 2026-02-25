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

  const from = (location.state as any)?.from?.pathname || '/';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 lg:col-span-7">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Autenticação segura
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-gray-900">
                Acesse sua plataforma financeira com segurança
              </h1>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                Faça login para visualizar indicadores, controlar receitas e despesas e manter seu fluxo de caixa em dia.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-gray-900">Insights em tempo real</p>
                  <p className="mt-1">Dashboards claros para decisões rápidas.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="font-medium text-gray-900">Controle centralizado</p>
                  <p className="mt-1">Categorias, contas e cartões em um só lugar.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Entrar</h2>
                <p className="text-sm text-gray-500 mt-1">Use seu email e senha para continuar</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                      className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Senha</label>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 text-white font-medium py-3 transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <div className="mt-6 text-xs text-gray-400">
                Ao continuar, você concorda com os termos de uso da plataforma.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
