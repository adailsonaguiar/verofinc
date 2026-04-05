import React, { useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService';
import { Category, CategoryType } from '../types';
import { CategoryForm } from '../components/CategoryForm';
import { CategoryCard } from '../components/CategoryCard';
import { Loader2, FolderOpen, Plus, Filter, Search } from 'lucide-react';

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
      setError('Falha ao carregar categorias.');
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
      alert('Falha ao criar categoria.');
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
      alert('Falha ao atualizar categoria.');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Deseja realmente excluir "${category.name}"?`)) return;
    try {
      await categoryService.delete(category._id);
      await loadCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Falha ao excluir categoria. Ela pode estar em uso por transações.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCategories = categories.filter(cat => {
    if (filterActive === 'active') return cat.active;
    if (filterActive === 'inactive') return !cat.active;
    return true;
  });

  if (loading && categories.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Organizando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Categorias</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Personalize a organização das suas finanças.</p>
          </div>
          {!showForm && !editingCategory && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              <span>Nova Categoria</span>
            </button>
          )}
        </div>

        {/* Transitioning Form Section */}
        {(showForm || editingCategory) && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
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
        )}

        {/* Categories List Container */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/60 shadow-sm overflow-hidden flex flex-col">
          
          {/* List Header / Filters */}
          <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Filtrar Status</span>
             </div>
             
             <div className="p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex gap-1 border border-slate-200/50 dark:border-slate-700/50">
                {(['all', 'active', 'inactive'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterActive(filter)}
                    className={`px-5 py-2 rounded-xl text-[13px] font-bold capitalize transition-all duration-300 ${
                      filterActive === filter
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    {filter === 'all' ? 'Todas' : filter === 'active' ? 'Ativas' : 'Inativas'}
                  </button>
                ))}
             </div>
          </div>

          {/* List Content */}
          <div className="p-6 md:p-8 space-y-4">
            {filteredCategories.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {filteredCategories.map(category => (
                   <CategoryCard
                     key={category._id}
                     category={category}
                     onEdit={handleEdit}
                     onDelete={handleDelete}
                   />
                 ))}
               </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhuma categoria aqui</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
                  {filterActive !== 'all' 
                    ? `Não encontramos categorias ${filterActive === 'active' ? 'ativas' : 'inativas'}.` 
                    : 'Sua lista está vazia. Crie categorias para organizar suas transações.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-8 py-5 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-50 dark:border-slate-700/30">
             <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <Search className="w-3.5 h-3.5" />
                <span>Mostrando {filteredCategories.length} de {categories.length} categorias cadastradas</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
