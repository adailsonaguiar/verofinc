import React, { useState } from 'react';
import { Category, CategoryType } from '../types';
import { Save, X } from 'lucide-react';

interface CategoryFormProps {
  onSubmit: (data: {
    name: string;
    description?: string;
    icon?: string;
    type: CategoryType;
    active?: boolean;
  }) => Promise<void>;
  onCancel?: () => void;
  initialData?: Category;
  isEditing?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(
    initialData?.description || ''
  );
  const [icon, setIcon] = useState(initialData?.icon || '');
  const [type, setType] = useState<CategoryType>(
    initialData?.type || CategoryType.EXPENSE
  );
  const [active, setActive] = useState(initialData?.active ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        type,
        active,
      });

      if (!isEditing) {
        setName('');
        setDescription('');
        setIcon('');
        setType(CategoryType.EXPENSE);
        setActive(true);
      }
    } catch (error) {
      console.error('Error submitting category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/60 shadow-xl shadow-indigo-500/5 p-8 sm:p-10"
    >
      <div className="flex items-center gap-4 mb-8">
        <div
          className={`p-3 rounded-2xl ${isEditing ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'}`}
        >
          <Save className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Defina as propriedades
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label
            htmlFor="name"
            className="text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1"
          >
            Nome da Categoria *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700"
            placeholder="Ex: Alimentação, Transporte, Lazer..."
            required
          />
        </div>

        <div className="md:col-span-2 space-y-3">
          <label className="text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
            Tipo de Categoria *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType(CategoryType.INCOME)}
              className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border ${
                type === CategoryType.INCOME
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                  : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600'
              }`}
            >
              💰 Receita
            </button>
            <button
              type="button"
              onClick={() => setType(CategoryType.EXPENSE)}
              className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border ${
                type === CategoryType.EXPENSE
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/30 shadow-lg shadow-rose-500/5'
                  : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600'
              }`}
            >
              💸 Despesa
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="icon"
            className="text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1"
          >
            Ícone (Emoji)
          </label>
          <input
            type="text"
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-center text-2xl"
            placeholder="🍔"
            maxLength={5}
          />
        </div>

        <div className="flex items-end pb-4 pl-2">
          <label className="relative flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            <span className="ml-3 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
              Categoria Ativa
            </span>
          </label>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label
            htmlFor="description"
            className="text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1"
          >
            Descrição (Opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
            placeholder="Algum comentário extra..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 order-2 sm:order-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {loading
            ? 'Salvando...'
            : isEditing
              ? 'Atualizar Categoria'
              : 'Criar Categoria'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 order-1 sm:order-2 py-4 px-6 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
