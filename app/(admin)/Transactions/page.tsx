import React from 'react';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function TransactionsPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8'>
      {/* HEADER DA PÁGINA */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Transações</h1>
          <p className='text-zinc-400 text-sm'>
            Gerencie todas as suas entradas e saídas.
          </p>
        </div>
        <div className='flex gap-2'>
          <button className='flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-2 rounded-lg text-sm transition-all'>
            <Download className='w-4 h-4 text-zinc-400' />
            <span>Exportar CSV</span>
          </button>
          <button className='bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20'>
            + Nova Transação
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className='bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center'>
        <div className='relative w-full sm:w-96'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500' />
          <input
            type='text'
            placeholder='Buscar por descrição, categoria...'
            className='w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-all placeholder:text-zinc-600'
          />
        </div>

        <div className='flex gap-2 w-full sm:w-auto'>
          <button className='flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm hover:border-zinc-700 transition-colors text-zinc-300'>
            <Calendar className='w-4 h-4 text-zinc-500' />
            <span>Este Mês</span>
          </button>
          <button className='flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm hover:border-zinc-700 transition-colors text-zinc-300'>
            <Filter className='w-4 h-4 text-zinc-500' />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* TABELA DE DADOS */}
      <div className='bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-zinc-900/50 text-zinc-400 font-medium uppercase text-xs'>
              <tr>
                <th className='px-6 py-4'>Descrição</th>
                <th className='px-6 py-4'>Categoria</th>
                <th className='px-6 py-4'>Data</th>
                <th className='px-6 py-4'>Status</th>
                <th className='px-6 py-4 text-right'>Valor</th>
                <th className='px-6 py-4 text-center'>Ações</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-800/50'>
              {/* LINHA 1 - SAÍDA */}
              <tr className='group hover:bg-zinc-900/40 transition-colors'>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-zinc-800 p-2 rounded-full'>
                      <ArrowUpRight className='w-4 h-4 text-rose-500' />
                    </div>
                    <div>
                      <p className='font-medium text-white'>AWS Services</p>
                      <p className='text-xs text-zinc-500'>Cartão Final 4242</p>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <span className='px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-700'>
                    Infraestrutura
                  </span>
                </td>
                <td className='px-6 py-4 text-zinc-400'>12 Jan, 2024</td>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-1.5 text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full w-fit'>
                    <CheckCircle2 className='w-3 h-3' /> Pago
                  </div>
                </td>
                <td className='px-6 py-4 text-right font-medium text-white'>
                  - R$ 150,00
                </td>
                <td className='px-6 py-4 text-center'>
                  <button className='text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-all'>
                    <MoreHorizontal className='w-4 h-4' />
                  </button>
                </td>
              </tr>

              {/* LINHA 2 - ENTRADA */}
              <tr className='group hover:bg-zinc-900/40 transition-colors'>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-zinc-800 p-2 rounded-full'>
                      <ArrowDownLeft className='w-4 h-4 text-emerald-500' />
                    </div>
                    <div>
                      <p className='font-medium text-white'>Venda CodeCanyon</p>
                      <p className='text-xs text-zinc-500'>Payout Semanal</p>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <span className='px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-700'>
                    Vendas
                  </span>
                </td>
                <td className='px-6 py-4 text-zinc-400'>11 Jan, 2024</td>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-1.5 text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full w-fit'>
                    <CheckCircle2 className='w-3 h-3' /> Recebido
                  </div>
                </td>
                <td className='px-6 py-4 text-right font-medium text-emerald-500'>
                  + R$ 450,00
                </td>
                <td className='px-6 py-4 text-center'>
                  <button className='text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-all'>
                    <MoreHorizontal className='w-4 h-4' />
                  </button>
                </td>
              </tr>

              {/* LINHA 3 - PENDENTE (IA Tag) */}
              <tr className='group hover:bg-zinc-900/40 transition-colors bg-purple-500/5'>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-zinc-800 p-2 rounded-full'>
                      <ArrowUpRight className='w-4 h-4 text-zinc-400' />
                    </div>
                    <div>
                      <p className='font-medium text-white'>Apple Store</p>
                      <p className='text-xs text-purple-400 flex items-center gap-1'>
                        ✨ Importado via IA
                      </p>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4'>
                  <span className='px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-700'>
                    Software
                  </span>
                </td>
                <td className='px-6 py-4 text-zinc-400'>10 Jan, 2024</td>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-1.5 text-amber-500 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded-full w-fit'>
                    <Clock className='w-3 h-3' /> Pendente
                  </div>
                </td>
                <td className='px-6 py-4 text-right font-medium text-white'>
                  - R$ 29,90
                </td>
                <td className='px-6 py-4 text-center'>
                  <button className='text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-all'>
                    <MoreHorizontal className='w-4 h-4' />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Footer da Tabela (Paginação) */}
        <div className='p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500'>
          <span>Mostrando 3 de 128 transações</span>
          <div className='flex gap-2'>
            <button className='px-3 py-1 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors disabled:opacity-50'>
              Anterior
            </button>
            <button className='px-3 py-1 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors text-white'>
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
