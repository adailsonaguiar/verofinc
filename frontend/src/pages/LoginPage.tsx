import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Sparkles, TrendingUp, Wallet } from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Não foi possível entrar com o Google.';
      setError(message);
    } finally {
      setGoogleLoading(false);
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

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-navy-200" />
            <span className="text-xs text-navy-500">ou</span>
            <span className="h-px flex-1 bg-navy-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-navy-200 bg-[#171719] px-3 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" />
            {googleLoading ? 'Conectando...' : 'Entrar com Google'}
          </button>

          <div className="mt-6 text-xs text-navy-500">
            Ao continuar, você concorda com os termos de uso da plataforma.
          </div>
        </div>
      </div>
    </div>
  );
};
