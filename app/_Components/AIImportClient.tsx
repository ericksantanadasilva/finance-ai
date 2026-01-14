'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Code2,
  Check,
  Loader2,
  Trash2,
} from 'lucide-react';
import { processTransactionWithAI } from '../_actions/ai-import';
import { createTransaction } from '../_actions/transactions';

interface AIResult {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export default function AIImportClient() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<AIResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleProcessAI = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await processTransactionWithAI(text);
      if (data) setResults(data);
    } catch (error) {
      alert('Erro ao processar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const t of results) {
        await createTransaction(t);
      }
      alert('Tudo salvo no banco!');
      setResults([]);
      setText('');
    } catch (error) {
      alert('Erro ao salvar algumas transações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {/* LADO ESQUERDO: INPUT */}
      <div className='bg-zinc-900/30 border border-zinc-800 rounded-xl p-1'>
        <div className='p-4 border-b border-zinc-800/50 flex justify-between items-center'>
          <span className='text-sm font-medium text-zinc-300 flex items-center gap-2'>
            <FileText className='w-4 h-4' /> Entrada de Dados
          </span>
          <button
            onClick={() => setText('')}
            className='text-xs text-purple-400 hover:text-purple-300'
          >
            Limpar
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className='w-full h-80 bg-zinc-950/50 p-4 text-sm text-zinc-300 resize-none outline-none font-mono placeholder:text-zinc-700'
          placeholder='Cole seu extrato aqui...'
        />
        <div className='p-4 border-t border-zinc-800/50'>
          <button
            onClick={handleProcessAI}
            disabled={loading || !text}
            className='w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20'
          >
            {loading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Sparkles className='w-4 h-4' />
            )}
            {loading ? 'Analisando...' : 'Processar com IA'}
          </button>
        </div>
      </div>

      {/* LADO DIREITO: PREVIEW */}
      <div className='bg-zinc-900 border border-zinc-800 rounded-xl p-1 relative overflow-hidden flex flex-col'>
        <div className='p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80 backdrop-blur relative z-10'>
          <span className='text-sm font-medium text-zinc-300 flex items-center gap-2'>
            <Code2 className='w-4 h-4' /> Preview dos Dados
          </span>
          {results.length > 0 && (
            <span className='text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20'>
              {results.length} Identificados
            </span>
          )}
        </div>

        <div className='p-4 flex-1 overflow-y-auto font-mono text-xs relative z-10 space-y-3 custom-scrollbar'>
          {results.length === 0 && !loading && (
            <div className='h-full flex flex-col items-center justify-center text-zinc-600 italic'>
              Aguardando processamento...
            </div>
          )}

          {results.map((item, idx) => (
            <div
              key={idx}
              className={`bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg border-l-2 ${
                item.type === 'income'
                  ? 'border-l-emerald-500'
                  : 'border-l-rose-500'
              }`}
            >
              <div className='flex justify-between mb-1'>
                <span
                  className={
                    item.type === 'income'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                >
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(item.amount)}
                </span>
                <span className='text-zinc-500 uppercase'>{item.type}</span>
              </div>
              <div className='text-zinc-300 font-bold'>{item.description}</div>
              <div className='text-zinc-500 text-[10px] mt-1'>
                Pasta: {item.category} • Data: {item.date}
              </div>
            </div>
          ))}
        </div>

        <div className='p-4 border-t border-zinc-800 bg-zinc-900/80 relative z-10'>
          <button
            onClick={handleSaveAll}
            disabled={saving || results.length === 0}
            className='w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all'
          >
            {saving ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Check className='w-4 h-4' />
            )}
            {saving
              ? 'Salvando no Banco...'
              : `Confirmar e Salvar (${results.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
