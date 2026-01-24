import React from 'react';
import { Category, CategoryType } from '../types';
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit, onDelete }) => {
  const isIncome = category.type === CategoryType.INCOME;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-3 rounded-xl shadow-sm ${
            isIncome 
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600' 
              : 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600'
          }`}>
            {category.icon ? (
              <span className="text-2xl leading-none">{category.icon}</span>
            ) : isIncome ? (
              <TrendingUp className="w-5 h-5" strokeWidth={2} />
            ) : (
              <TrendingDown className="w-5 h-5" strokeWidth={2} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {category.name}
              </h3>
              <span className={`px-2.5 py-1 text-xs rounded-lg font-semibold ${
                isIncome 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {isIncome ? 'Receita' : 'Despesa'}
              </span>
              {!category.active && (
                <span className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg font-semibold">
                  Inativa
                </span>
              )}
            </div>
            
            {category.description && (
              <p className="text-sm text-gray-600 line-clamp-2 font-medium">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(category)}
            className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            title="Editar categoria"
          >
            <Pencil className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
            title="Excluir categoria"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};
