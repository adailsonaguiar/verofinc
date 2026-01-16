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
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 hover:shadow-md transition-shadow ${
      isIncome ? 'border-green-500' : 'border-red-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${
            isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {category.icon ? (
              <span className="text-2xl">{category.icon}</span>
            ) : isIncome ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {category.name}
              </h3>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                isIncome 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {isIncome ? 'Income' : 'Expense'}
              </span>
              {!category.active && (
                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            
            {category.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit category"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
