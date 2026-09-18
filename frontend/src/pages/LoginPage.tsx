import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Sparkles, TrendingUp, Wallet } from 'lucide-react';

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
    <div className="min-h-screen bg-bone text-navy-900">
      <div className="mx-auto grid min-h-screen max-w-5xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="flex items-center gap-2.5 text-3xl font-bold tracking-[-0.06em]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-400 text-xl text-[#141414]">
              ✦
            </span>
            nivo
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-navy-300">
            Finanças pessoais
          </p>

          <h1 className="mt-10 max-w-md text-4xl font-bold leading-tight tracking-[-0.04em]">
            Sua vida financeira, em um só retrato.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-500">
            Registre entradas e saídas, acompanhe contas e cartões e veja para
            onde o dinheiro vai — tudo em um lugar calmo e legível.
          </p>

          <div className="mt-10 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-bone-border bg-[#121214] p-4">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-400/15 text-gold-400">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-navy-900">
                  Insights em tempo real
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  Painéis claros para decisões rápidas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-bone-border bg-[#121214] p-4">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-400/15 text-gold-400">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-navy-900">
                  Controle centralizado
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  Categorias, contas e cartões em um só lugar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-bone-border bg-[#121214] p-8">
          <div className="mb-8 flex items-center gap-2.5 text-2xl font-bold tracking-[-0.06em] lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-400 text-base text-[#141414]">
              ✦
            </span>
            nivo
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-400" />
            <h2 className="text-2xl font-bold tracking-[-0.04em]">Entrar</h2>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            Use seu email e senha para continuar
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-[#171719] px-3 focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400">
                <Mail className="h-4 w-4 shrink-0 text-navy-300" />
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
              <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-[#171719] px-3 focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400">
                <Lock className="h-4 w-4 shrink-0 text-navy-300" />
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
