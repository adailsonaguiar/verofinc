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
    <div className="flex-1 overflow-auto bg-mac-bg text-mac-text">
      <div className="mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
          {!showForm && !editingCategory && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow hover:from-blue-700 hover:to-blue-900 transition-colors font-semibold border border-blue-700"
            >
              <Plus className="w-5 h-5" />
              Nova categoria
            </button>
          )}
        </div>

        {showForm || editingCategory ? (
          <div className="mb-6">
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

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1.5 rounded font-medium transition-colors border ${
                filterActive === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-700 shadow'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              Todas ({categories.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1.5 rounded font-medium transition-colors border ${
                filterActive === 'active'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-700 shadow'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              Ativas ({categories.filter(c => c.active).length})
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1.5 rounded font-medium transition-colors border ${
                filterActive === 'inactive'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-700 shadow'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              Inativas ({categories.filter(c => !c.active).length})
            </button>
          </div>
          <div className="space-y-2">
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
              <div className="bg-mac-card rounded-2xl border border-mac-border p-10 text-center">
                <FolderOpen className="w-12 h-12 text-mac-icon mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-mac-title mb-1">Nenhuma categoria</h3>
                <p className="text-mac-muted">
                  {filterActive !== 'all'
                    ? `Nenhuma categoria ${filterActive} encontrada`
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
