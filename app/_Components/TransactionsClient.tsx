'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
} from 'lucide-react';
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

  // Filtro de busca
  const filteredTransactions = initialTransactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir para Edição
  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  // Abrir para Criação
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
    <div className='min-h-screen bg-zinc-950 text-zinc-50 p-8'>
      <TransactionDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={selectedTransaction}
      />

      {/* HEADER */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold'>Transações</h1>
          <p className='text-zinc-400 text-sm'>
            Gerencie todas as suas entradas e saídas.
          </p>
        </div>
        <button
          onClick={handleNew}
          className='bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2'
        >
          <Plus className='w-4 h-4' /> Nova Transação
        </button>
      </div>

      {/* FILTROS */}
      <div className='bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 mb-6'>
        <div className='relative w-full sm:w-96'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500' />
          <input
            type='text'
            placeholder='Buscar transação...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-all'
          />
        </div>
      </div>

      {/* TABELA */}
      <div className='bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-zinc-900/50 text-zinc-400 font-medium uppercase text-xs'>
              <tr>
                <th className='px-6 py-4'>Descrição</th>
                <th className='px-6 py-4'>Categoria</th>
                <th className='px-6 py-4'>Data</th>
                <th className='px-6 py-4 text-right'>Valor</th>
                <th className='px-6 py-4 text-center'>Ações</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-800/50'>
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className='group hover:bg-zinc-900/40 transition-colors'
                >
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-zinc-800 p-2 rounded-full'>
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className='w-4 h-4 text-emerald-500' />
                        ) : (
                          <ArrowUpRight className='w-4 h-4 text-rose-500' />
                        )}
                      </div>
                      <span className='font-medium text-white'>
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className='px-2 py-1 rounded text-xs border'
                      style={{
                        backgroundColor: `${tx.category?.color}10`,
                        borderColor: `${tx.category?.color}40`,
                        color: tx.category?.color,
                      }}
                    >
                      {tx.category?.name || 'Geral'}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-zinc-400'>
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-medium ${
                      tx.type === 'income' ? 'text-emerald-500' : 'text-white'
                    }`}
                  >
                    {tx.type === 'expense' && '- '}
                    {formatMoney(tx.amount)}
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
        {filteredTransactions.length === 0 && (
          <div className='p-8 text-center text-zinc-500'>
            Nenhuma transação encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
