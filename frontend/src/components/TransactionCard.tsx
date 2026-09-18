import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/transactions';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

/**
 * Compact transaction row used on mobile (and inside account/card statements),
 * following the reference list style: round icon, description, meta line, mono amount.
 */
export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isIncome = transaction.type === 'income';
  const isPaid = transaction.status === 'paid';

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
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bone-soft ${
        !isPaid ? 'opacity-70' : ''
      }`}
    >
      <span
        className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${
          isIncome
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-rose-100 text-rose-700'
        }`}
      >
        {isIncome ? (
          <ArrowDown className="w-4 h-4" />
        ) : (
          <ArrowUp className="w-4 h-4" />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-navy-900 truncate">
          {transaction.description}
        </div>
        <div className="text-xs text-navy-500 mt-0.5 truncate">
          {transaction.category?.name || 'Sem categoria'} ·{' '}
          {formatDate(transaction.date)}
          {!isPaid && (
            <span className="ml-2 text-[0.7rem] uppercase tracking-wide text-amber-600">
              Pendente
            </span>
          )}
        </div>
      </div>

      <div
        className={`num text-sm shrink-0 ${
          isIncome ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </div>

      {(onEdit || onDelete) && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg text-navy-300 hover:text-navy-700 hover:bg-navy-100 transition-colors"
            title="Opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-[#171719] rounded-lg border border-bone-border shadow-lg py-1 z-50">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(transaction);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-navy-700 hover:bg-bone-soft flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(transaction);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
