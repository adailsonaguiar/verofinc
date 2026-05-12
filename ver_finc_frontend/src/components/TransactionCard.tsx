import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/transactions';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Tag,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  isDraggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  isDraggable = false,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isIncome = transaction.type === 'income';
  const isPaid = transaction.status === 'paid';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-5 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group ${
        !isPaid ? 'opacity-60 hover:opacity-100' : ''
      } ${
        isDragging ? 'opacity-40 scale-[0.98] border-indigo-300 dark:border-indigo-500/50 shadow-lg' : ''
      } ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {/* Desktop layout: single row. Mobile layout: two rows */}
      <div className="flex items-start gap-3">
        {/* Drag handle — hidden on mobile */}
        {isDraggable && (
          <div className="hidden sm:flex shrink-0 items-center self-center text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 transition-colors cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Icon */}
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300 ${
            isIncome
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {isIncome ? (
            <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          ) : (
            <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top row: description + menu (desktop: + amount) */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                {transaction.description}
              </h3>

              {/* Amount — shown below title on mobile, hidden on sm+ */}
              <p
                className={`sm:hidden text-base font-extrabold tracking-tight mb-1.5 ${
                  isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(transaction.date)}</span>
                </div>

                {transaction.category && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{transaction.category.name}</span>
                  </div>
                )}

                {!isPaid && (
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg uppercase tracking-wider text-[10px] font-extrabold">
                    Pendente
                  </span>
                )}
              </div>
            </div>

            {/* Right side: amount (desktop only) + menu */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Amount — hidden on mobile, shown on sm+ */}
              <p
                className={`hidden sm:block text-lg font-extrabold tracking-tight ${
                  isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>

              {(onEdit || onDelete) && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
                    title="Opções"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(transaction);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-3 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Editar Transação</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(transaction);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
