import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/transactions';
import { ArrowUpCircle, ArrowDownCircle, Calendar, Tag, MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onEdit, onDelete }) => {
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
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 p-4 hover:shadow-md transition-shadow ${
        isIncome ? 'border-green-500' : 'border-red-500'
      } ${!isPaid ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`p-2 rounded-lg ${
              isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {isIncome ? (
              <ArrowUpCircle className="w-5 h-5" />
            ) : (
              <ArrowDownCircle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {transaction.description}
            </h3>
            
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(transaction.date)}</span>
              </div>
              
              {transaction.category && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{transaction.category.name}</span>
                </div>
              )}
              
              {!isPaid && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                  Unpaid
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right ml-4 flex flex-col items-end">
          <p
            className={`text-lg font-bold ${
              isIncome ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
          </p>
          {(onEdit || onDelete) && (
            <div className="relative mt-2" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(transaction);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(transaction);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
