import React, { useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService';
import { Category, CategoryType } from '../types';
import { CategoryForm } from '../components/CategoryForm';
import { CategoryCard } from '../components/CategoryCard';
import { EmptyState } from '../components/EmptyState';
import { Loader2, Plus } from 'lucide-react';

type CategoryPayload = {
  name: string;
  description?: string;
  icon?: string;
  type: CategoryType;
  active?: boolean;
};

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterActive, setFilterActive] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setCategories(await categoryService.getAll());
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CategoryPayload) => {
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory._id, data);
        setEditingCategory(null);
      } else {
        await categoryService.create(data);
        setShowForm(false);
      }
      await loadCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Falha ao salvar categoria.');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Deseja realmente excluir "${category.name}"?`)) return;
    try {
      await categoryService.delete(category._id);
      await loadCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert(
        'Falha ao excluir categoria. Ela pode estar em uso por transações.'
      );
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCategories = categories.filter((cat) => {
    if (filterActive === 'active') return cat.active;
    if (filterActive === 'inactive') return !cat.active;
    return true;
  });

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-700 mb-3" />
          <p className="text-sm text-navy-500">Organizando categorias...</p>
        </div>
      </div>
    );
  }

  const FILTERS = [
    { key: 'all' as const, label: 'Todas' },
    { key: 'active' as const, label: 'Ativas' },
    { key: 'inactive' as const, label: 'Inativas' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-navy-500">
          Personalize a organização das suas finanças.
        </p>
        {!showForm && !editingCategory && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Nova categoria
          </button>
        )}
      </div>

      {(showForm || editingCategory) && (
        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          initialData={editingCategory || undefined}
          isEditing={!!editingCategory}
        />
      )}

      <div className="card">
        <div className="px-4 py-4 border-b border-bone-divider flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-1 bg-navy-50 p-1 rounded-lg text-sm">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterActive(filter.key)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  filterActive === filter.key
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-navy-500">
            {filteredCategories.length} de {categories.length} categorias
          </span>
        </div>

        {filteredCategories.length > 0 ? (
          <div className="divide-classic px-3">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category._id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Plus className="w-6 h-6" />}
            title="Nenhuma categoria aqui"
            description={
              filterActive === 'all'
                ? 'Sua lista está vazia. Crie categorias para organizar suas transações.'
                : `Não encontramos categorias ${
                    filterActive === 'active' ? 'ativas' : 'inativas'
                  }.`
            }
          />
        )}
      </div>
    </div>
  );
};
