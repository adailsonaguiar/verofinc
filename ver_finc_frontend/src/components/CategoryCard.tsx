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
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 p-5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300 ${
            isIncome 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            {category.icon ? (
              <span className="text-2xl leading-none transition-all">{category.icon}</span>
            ) : isIncome ? (
              <TrendingUp className="w-6 h-6" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="w-6 h-6" strokeWidth={2.5} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-none">
                {category.name}
              </h3>
              {!category.active && (
                <span className="px-2 py-0.5 text-[10px] bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-md font-black uppercase tracking-wider">
                  Inativa
                </span>
              )}
            </div>
            
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
               <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
               {isIncome ? 'Receita' : 'Despesa'}
               {category.description && <span className="text-slate-300 dark:text-slate-700 mx-1.5">|</span>}
               {category.description && <span className="normal-case tracking-normal truncate">{category.description}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(category)}
            className="p-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl transition-all duration-200 active:scale-90"
            title="Editar categoria"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all duration-200 active:scale-90"
            title="Excluir categoria"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
