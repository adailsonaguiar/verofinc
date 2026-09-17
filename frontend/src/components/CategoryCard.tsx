import React from 'react';
import { Category, CategoryType } from '../types';
import { Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
}) => {
  const isIncome = category.type === CategoryType.INCOME;

  return (
    <div className="flex items-center gap-3 py-3 px-1 transition-colors">
      <span
        className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${
          isIncome
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-rose-100 text-rose-700'
        }`}
      >
        {category.icon ? (
          <span className="text-base leading-none">{category.icon}</span>
        ) : isIncome ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-navy-900 truncate">
            {category.name}
          </span>
          <span
            className={`chip ${
              isIncome
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isIncome ? 'Receita' : 'Despesa'}
          </span>
          {!category.active && (
            <span className="chip bg-bone-soft text-navy-500 border border-bone-border">
              Inativa
            </span>
          )}
        </div>
        {category.description && (
          <div className="text-xs text-navy-500 mt-0.5 truncate">
            {category.description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(category)}
          className="p-2 rounded-lg text-navy-300 hover:text-navy-700 hover:bg-navy-100 transition-colors"
          title="Editar categoria"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-2 rounded-lg text-navy-300 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title="Excluir categoria"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
