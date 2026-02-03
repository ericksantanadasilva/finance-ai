'use client';

import React, { useState } from 'react';
import { Search, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { TransactionRowActions } from './TransactionRowActions';
import TransactionDialog from '../_Components/TransactionDialog';

export default function TransactionsClient({
  initialTransactions,
}: {
  initialTransactions: any[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const filteredTransactions = initialTransactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v);

  return (
    <div className='min-h-screen bg-background text-foreground p-4 sm:p-8 transition-colors duration-300'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={selectedTransaction}
      />

      {/* HEADER */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-12 sm:pt-0'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold'>Transações</h1>
          <p className='text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium'>
            Gerencie todas as suas entradas e saídas de forma inteligente.
          </p>
        </div>
        <button
          onClick={handleNew}
          className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95'
        >
          <Plus className='w-4 h-4' /> NOVA TRANSAÇÃO
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className='bg-surface border border-border-custom rounded-2xl p-4 shadow-sm mb-6'>
        <div className='relative w-full sm:w-96'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400' />
          <input
            type='text'
            placeholder='Buscar por descrição ou categoria...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full bg-background border border-border-custom focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all placeholder:text-zinc-500'
          />
        </div>
      </div>

      {/* TABELA PRINCIPAL */}
      <div className='bg-surface border border-border-custom rounded-2xl overflow-hidden shadow-sm'>
        {/* DESKTOP VIEW */}
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full text-sm text-left border-collapse'>
            <thead className='bg-zinc-50 dark:bg-zinc-900/50 border-b border-border-custom'>
              <tr>
                <th className='px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Descrição
                </th>
                <th className='px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Categoria
                </th>
                <th className='px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest'>
                  Data
                </th>
                <th className='px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right'>
                  Valor
                </th>
                <th className='px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center'>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border-custom'>
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className='group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors'
                >
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className='w-4 h-4 text-emerald-600 dark:text-emerald-500' />
                        ) : (
                          <ArrowUpRight className='w-4 h-4 text-rose-600 dark:text-rose-500' />
                        )}
                      </div>
                      <span className='font-bold text-foreground'>
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className='px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border'
                      style={{
                        backgroundColor: `${tx.category?.color}15`,
                        borderColor: `${tx.category?.color}30`,
                        color: tx.category?.color,
                      }}
                    >
                      {tx.category?.name || 'Geral'}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium'>
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-black ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-foreground'}`}
                  >
                    {tx.type === 'expense'
                      ? `- ${formatMoney(tx.amount)}`
                      : formatMoney(tx.amount)}
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <TransactionRowActions
                      transactionId={tx.id}
                      onEdit={() => handleEdit(tx)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW (CARDS) */}
        <div className='md:hidden divide-y divide-border-custom'>
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className='p-4 space-y-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors'
            >
              <div className='flex justify-between items-start'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`p-2.5 rounded-xl ${tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className='w-4 h-4 text-emerald-600 dark:text-emerald-500' />
                    ) : (
                      <ArrowUpRight className='w-4 h-4 text-rose-600 dark:text-rose-500' />
                    )}
                  </div>
                  <div>
                    <p className='font-bold text-foreground text-sm'>
                      {tx.description}
                    </p>
                    <p className='text-[10px] font-medium text-zinc-500'>
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <TransactionRowActions
                  transactionId={tx.id}
                  onEdit={() => handleEdit(tx)}
                />
              </div>

              <div className='flex justify-between items-center'>
                <span
                  className='px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider'
                  style={{
                    color: tx.category?.color,
                    borderColor: `${tx.category?.color}40`,
                    backgroundColor: `${tx.category?.color}10`,
                  }}
                >
                  {tx.category?.name || 'Geral'}
                </span>
                <span
                  className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-foreground'}`}
                >
                  {tx.type === 'expense'
                    ? `- ${formatMoney(tx.amount)}`
                    : formatMoney(tx.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className='p-16 text-center text-zinc-400 text-sm font-medium italic'>
            Nenhuma transação encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
