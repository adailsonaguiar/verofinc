import React, { useState } from 'react';
import { Category, CategoryType } from '../types';
import { Save, X } from 'lucide-react';

interface CategoryFormProps {
  onSubmit: (data: { name: string; description?: string; icon?: string; type: CategoryType; active?: boolean }) => Promise<void>;
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
  const [description, setDescription] = useState(initialData?.description || '');
  const [icon, setIcon] = useState(initialData?.icon || '');
  const [type, setType] = useState<CategoryType>(initialData?.type || CategoryType.EXPENSE);
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
      </h3>

      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Nome *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors outline-none font-medium"
            placeholder="Ex: Alimentação, Transporte, Lazer"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Tipo *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType(CategoryType.INCOME)}
              className={`px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 border text-sm ${
                type === CategoryType.INCOME
                  ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm border-emerald-700/20'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
            >
              💰 Receita
            </button>
            <button
              type="button"
              onClick={() => setType(CategoryType.EXPENSE)}
              className={`px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 border text-sm ${
                type === CategoryType.EXPENSE
                  ? 'bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-sm border-rose-700/20'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
            >
              💸 Despesa
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors outline-none resize-none font-medium"
            placeholder="Descrição opcional..."
          />
        </div>

        <div>
          <label htmlFor="icon" className="block text-sm font-semibold text-gray-700 mb-2">
            Ícone (emoji)
          </label>
          <input
            type="text"
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors outline-none font-medium"
            placeholder="🍔 ou 🚗"
            maxLength={10}
          />
        </div>

        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="active" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
            Categoria ativa
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm border border-indigo-700/20 disabled:border-gray-500/20"
        >
          <Save className="w-5 h-5" strokeWidth={2} />
          {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" strokeWidth={2} />
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
