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
    <form onSubmit={handleSubmit} className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 rounded-full grid place-items-center ${
            isEditing
              ? 'bg-gold-400/20 text-gold-600'
              : 'bg-navy-100 text-navy-700'
          }`}
        >
          <Save className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display text-lg text-navy-900">
            {isEditing ? 'Editar categoria' : 'Nova categoria'}
          </h3>
          <p className="text-xs text-navy-500">Defina as propriedades</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="label">Nome da categoria *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Ex: Alimentação, Transporte, Lazer..."
            required
          />
        </div>

        <div className="md:col-span-2">
          <span className="label">Tipo de categoria *</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType(CategoryType.INCOME)}
              className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                type === CategoryType.INCOME
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-white text-navy-500 border-bone-border hover:bg-bone-soft'
              }`}
            >
              💰 Receita
            </button>
            <button
              type="button"
              onClick={() => setType(CategoryType.EXPENSE)}
              className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                type === CategoryType.EXPENSE
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-white text-navy-500 border-bone-border hover:bg-bone-soft'
              }`}
            >
              💸 Despesa
            </button>
          </div>
        </div>

        <div>
          <label className="label">Ícone (emoji)</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="input text-center text-xl"
            placeholder="🍔"
            maxLength={5}
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="sr-only peer"
            />
            <span className="w-11 h-6 rounded-full bg-navy-200 relative transition-colors peer-checked:bg-navy-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
            <span className="text-sm text-navy-700">Categoria ativa</span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="label">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="input resize-none"
            placeholder="Algum comentário extra..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-bone-divider">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="btn btn-primary flex-1 order-2 sm:order-1"
        >
          {loading
            ? 'Salvando...'
            : isEditing
              ? 'Atualizar categoria'
              : 'Criar categoria'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost flex-1 order-1 sm:order-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
