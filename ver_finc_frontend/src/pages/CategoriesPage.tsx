import React, { useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService';
import { Category, CategoryType } from '../types';
import { CategoryForm } from '../components/CategoryForm';
import { CategoryCard } from '../components/CategoryCard';
import { Loader2, FolderOpen, Plus } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories. Please make sure the backend is running.');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: {
    name: string;
    description?: string;
    icon?: string;
    type: CategoryType;
    active?: boolean;
  }) => {
    try {
      await categoryService.create(data);
      await loadCategories();
      setShowForm(false);
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Failed to create category. Please try again.');
    }
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string;
    icon?: string;
    type: CategoryType;
    active?: boolean;
  }) => {
    if (!editingCategory) return;

    try {
      await categoryService.update(editingCategory._id, data);
      await loadCategories();
      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category. Please try again.');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      await categoryService.delete(category._id);
      await loadCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category. It might be in use by transactions.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(false);
  };

  const filteredCategories = categories.filter(cat => {
    if (filterActive === 'active') return cat.active;
    if (filterActive === 'inactive') return !cat.active;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadCategories}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900">
      <div className="mx-auto px-6 py-8 max-w-5xl">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Categorias</h2>
            <p className="text-gray-500 font-medium">Gerencie suas categorias de transações</p>
          </div>
          {!showForm && !editingCategory && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white rounded-xl shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold border border-indigo-700/20"
            >
              <Plus className="w-5 h-5" />
              Nova categoria
            </button>
          )}
        </div>

        {showForm || editingCategory ? (
          <div className="mb-8">
            <CategoryForm
              onSubmit={editingCategory ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingCategory(null);
              }}
              initialData={editingCategory || undefined}
              isEditing={!!editingCategory}
            />
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 border text-sm ${
                filterActive === 'all'
                  ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-700/20 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              Todas ({categories.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 border text-sm ${
                filterActive === 'active'
                  ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-700/20 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              Ativas ({categories.filter(c => c.active).length})
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 border text-sm ${
                filterActive === 'inactive'
                  ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-700/20 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              Inativas ({categories.filter(c => !c.active).length})
            </button>
          </div>
          <div className="space-y-3">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-16 text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-gray-700 mb-2">Nenhuma categoria</h3>
                <p className="text-gray-500 font-medium">
                  {filterActive !== 'all'
                    ? `Nenhuma categoria ${filterActive === 'active' ? 'ativa' : 'inativa'} encontrada`
                    : 'Comece criando sua primeira categoria'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
