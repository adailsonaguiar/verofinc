import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';
import { budgetService } from '../services/budgetService';
import { BudgetCategoryItem, BudgetOverview } from '../types';
import { formatCurrency } from '../utils/transactions';
import { MonthSelector } from '../components/MonthSelector';
import { SectionTitle } from '../components/SectionTitle';
import { EmptyState } from '../components/EmptyState';
import { BudgetProgressBar } from '../components/BudgetProgressBar';
import { Button } from '../components/Button';
import { PageHeading } from '../components/PageHeading';

const brl = (cents: number) => formatCurrency(cents);

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (month: string, delta: number): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return format(new Date(y, m - 1), 'MMMM yyyy', { locale: ptBR });
};

function moneyToInput(cents: number | null): string {
  if (cents == null || cents === 0) return '';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatMoneyInput(digits: string): string {
  const number = Number(digits) / 100;
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function parseMoneyInput(value: string): number {
  return Number(value.replace(/\D/g, '')) / 100;
}

interface LimitEditorProps {
  initial: number | null;
  onSave: (limit: number) => Promise<void>;
  onRemove?: () => Promise<void>;
  onCancel: () => void;
}

const LimitEditor: React.FC<LimitEditorProps> = ({
  initial,
  onSave,
  onRemove,
  onCancel,
}) => {
  const [value, setValue] = useState(moneyToInput(initial));
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    setValue(formatMoneyInput(digits));
  };

  const handleSave = async () => {
    const limit = parseMoneyInput(value);
    if (!limit || limit <= 0) return;
    setSaving(true);
    try {
      await onSave(limit);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        inputMode="numeric"
        placeholder="R$ 0,00"
        className="input num !w-40 !py-2"
        aria-label="Valor do limite"
      />
      <button
        onClick={handleSave}
        disabled={saving || !parseMoneyInput(value)}
        className="btn btn-primary !px-3 !py-2 text-xs"
      >
        Salvar
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-2 rounded-lg text-navy-300 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title="Remover limite"
          aria-label="Remover limite"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={onCancel}
        className="p-2 rounded-lg text-navy-300 hover:text-navy-700 hover:bg-navy-100 transition-colors"
        title="Cancelar"
        aria-label="Cancelar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const BudgetsPage: React.FC = () => {
  const [month, setMonth] = useState(currentMonthKey());
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTotal, setEditingTotal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      setOverview(await budgetService.getOverview(month));
    } catch (err) {
      console.error('Error loading budget:', err);
      setError('Erro ao carregar o orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const resetEditing = () => {
    setEditingTotal(false);
    setEditingCategoryId(null);
  };

  const handleSaveTotal = async (limit: number) => {
    await budgetService.upsert(month, null, limit);
    resetEditing();
    await loadOverview();
  };

  const handleSaveCategory = async (categoryId: string, limit: number) => {
    await budgetService.upsert(month, categoryId, limit);
    resetEditing();
    await loadOverview();
  };

  const handleRemoveTotal = async () => {
    await budgetService.remove(month, null);
    resetEditing();
    await loadOverview();
  };

  const handleRemoveCategory = async (categoryId: string) => {
    await budgetService.remove(month, categoryId);
    resetEditing();
    await loadOverview();
  };

  const totalLimit = overview?.totalLimit ?? null;
  const totalSpent = overview?.totalSpent ?? 0;
  const totalPct = totalLimit ? Math.round((totalSpent / totalLimit) * 100) : null;
  const available = totalLimit != null ? totalLimit - totalSpent : null;

  const sortedItems = useMemo(
    () =>
      [...(overview?.items ?? [])].sort((a, b) => {
        if (a.limit != null && b.limit == null) return -1;
        if (a.limit == null && b.limit != null) return 1;
        return a.category.name.localeCompare(b.category.name);
      }),
    [overview?.items]
  );

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-700 mb-3" />
          <p className="text-sm text-navy-500">Organizando seu orçamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="card p-8 max-w-md">
          <h3 className="font-display text-lg text-navy-900 mb-2">
            Ops, algo deu errado
          </h3>
          <p className="text-sm text-navy-500 mb-6">{error}</p>
          <Button onClick={loadOverview}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 pb-8 pt-8 md:px-[50px] md:pt-12">
      <PageHeading
        title="Orçamento"
        subtitle="Defina limites por categoria e acompanhe seu progresso."
        actions={
          <MonthSelector
            label={monthLabel(month)}
            hasPrevious
            hasNext
            onPrevious={() => {
              resetEditing();
              setMonth(shiftMonth(month, -1));
            }}
            onNext={() => {
              resetEditing();
              setMonth(shiftMonth(month, 1));
            }}
          />
        }
      />

      {/* Total budget */}
      <div className="card p-5 md:p-6">
        <SectionTitle
          title="Orçamento do mês"
          subtitle="Seu limite geral de gastos"
          action={
            !editingTotal ? (
              <button
                onClick={() => setEditingTotal(true)}
                className="btn btn-outline !px-3 !py-1.5 text-xs"
              >
                {totalLimit != null ? (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    Ajustar
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Definir limite
                  </>
                )}
              </button>
            ) : null
          }
        />

        {editingTotal ? (
          <div className="mt-5">
            <LimitEditor
              initial={totalLimit}
              onSave={handleSaveTotal}
              onRemove={totalLimit != null ? handleRemoveTotal : undefined}
              onCancel={resetEditing}
            />
          </div>
        ) : totalLimit == null ? (
          <p className="text-sm text-navy-500 mt-4">
            Você ainda não definiu um orçamento para este mês.
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <div className="stat-label">Gasto</div>
            <div className="num text-xl md:text-2xl text-navy-900 mt-1.5">
              {brl(totalSpent)}
            </div>
          </div>
          <div>
            <div className="stat-label">Limite</div>
            <div className="num text-xl md:text-2xl text-navy-900 mt-1.5">
              {totalLimit != null ? brl(totalLimit) : '—'}
            </div>
          </div>
          <div>
            <div className="stat-label">Disponível</div>
            <div
              className={`num text-xl md:text-2xl mt-1.5 ${
                available == null
                  ? 'text-navy-900'
                  : available < 0
                    ? 'text-rose-700'
                    : 'text-emerald-700'
              }`}
            >
              {available != null ? brl(available) : '—'}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-navy-500">Progresso</span>
            <span className="num text-xs text-navy-700">
              {totalPct != null ? `${totalPct}%` : 'sem limite definido'}
            </span>
          </div>
          <BudgetProgressBar pct={totalPct} />
        </div>
      </div>

      {/* Per-category limits */}
      <div className="card">
        <div className="px-5 py-4 border-b border-bone-divider flex items-center justify-between">
          <div>
            <div className="font-display text-lg text-navy-900">
              Limites por categoria
            </div>
            <div className="text-xs text-navy-500 mt-0.5">
              Gastos por categoria neste mês
            </div>
          </div>
          <span className="text-xs text-navy-500">
            {sortedItems.filter((i) => i.limit != null).length} definidas
          </span>
        </div>

        {sortedItems.length > 0 ? (
          <div className="divide-classic px-5">
            {sortedItems.map((item: BudgetCategoryItem) => {
              const isEditing = editingCategoryId === item.category._id;
              const pct =
                item.limit != null
                  ? Math.round((item.spent / item.limit) * 100)
                  : null;

              return (
                <div key={item.category._id} className="py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 grid place-items-center shrink-0">
                      {item.category.icon ? (
                        <span className="text-base leading-none">
                          {item.category.icon}
                        </span>
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </span>

                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-navy-900 truncate block">
                        {item.category.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="num text-sm text-navy-900">
                        {brl(item.spent)}
                        {item.limit != null && (
                          <span className="text-navy-300"> / {brl(item.limit)}</span>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => setEditingCategoryId(item.category._id)}
                          className="text-xs text-navy-500 hover:text-navy-700 mt-0.5 inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          {item.limit != null ? 'Ajustar limite' : 'Definir limite'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 pl-12">
                      <LimitEditor
                        initial={item.limit}
                        onSave={(limit) =>
                          handleSaveCategory(item.category._id, limit)
                        }
                        onRemove={
                          item.limit != null
                            ? () => handleRemoveCategory(item.category._id)
                            : undefined
                        }
                        onCancel={resetEditing}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 pl-12">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-navy-500">
                          {pct != null ? `${pct}%` : 'sem limite'}
                        </span>
                        {pct != null && pct >= 100 && (
                          <span className="chip bg-rose-100 text-rose-800">
                            acima do limite
                          </span>
                        )}
                      </div>
                      <BudgetProgressBar pct={pct} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Target className="w-6 h-6" />}
            title="Nenhuma categoria de despesa"
            description="Crie categorias do tipo despesa para começar a planejar seu orçamento mensal."
            action={
              <Link to="/categories" className="btn btn-primary">
                <Plus className="w-4 h-4" />
                Criar categoria
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};
