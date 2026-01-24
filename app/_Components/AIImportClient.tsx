'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  UploadCloud,
  Loader2,
  Trash2,
  Save,
  CalendarDays,
} from 'lucide-react';
import {
  processFileWithAI,
  saveTransactions,
  getCategories2,
} from '@/app/_actions/ai-import';

export default function AIImportClient() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // NOVO: Estado para o mês de competência (Padrão: Mês Atual)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories2();
        setCategories(data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    }
    loadCategories();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve(reader.result?.toString().split(',')[1] || '');
    });
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const base64 = await fileToBase64(files[0]);
      const data = await processFileWithAI(base64, files[0].type);
      if (data) setResults(data);
    } catch (error) {
      alert('Erro ao ler o arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  const handleRemoveItem = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (results.length === 0) return;
    setSaving(true);
    try {
      // MUDANÇA: Agora passamos o selectedMonth para a action
      await saveTransactions(results, selectedMonth);
      alert('Transações importadas para o mês de referência com sucesso!');
      setResults([]);
      setFiles([]);
      router.push('/Dashboard');
    } catch (error) {
      alert('Erro ao salvar transações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-50 p-4 sm:p-8 transition-all duration-300'>
      <div className='mb-8 pt-12 lg:pt-0'>
        <h1 className='text-xl sm:text-2xl font-bold'>
          Importação Inteligente
        </h1>
        <p className='text-zinc-400 text-xs sm:text-sm'>
          As transações serão agrupadas no mês de referência escolhido.
        </p>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <div className='bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl'>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 sm:p-10 cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragActive
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/20'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className='w-10 h-10 text-zinc-600 mb-3' />
              <p className='text-sm text-zinc-300 text-center font-medium'>
                {files[0]?.name || 'Selecione o PDF ou Foto da Fatura'}
              </p>
            </div>

            <button
              onClick={handleProcess}
              disabled={loading || files.length === 0}
              className='w-full bg-purple-600 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-purple-500 disabled:opacity-50 text-sm font-bold shadow-lg'
            >
              {loading ? (
                <Loader2 className='animate-spin w-4 h-4' />
              ) : (
                <Sparkles className='w-4 h-4' />
              )}
              {loading ? 'Analisando documento...' : 'Processar com IA'}
            </button>
          </div>

          {/* SEÇÃO DO MÊS DE REFERÊNCIA (Aparece após processar) */}
          {results.length > 0 && (
            <div className='bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in'>
              <div className='flex items-center gap-3 mb-2'>
                <CalendarDays className='w-5 h-5 text-purple-400' />
                <h3 className='text-sm font-bold text-white'>
                  Mês de Referência
                </h3>
              </div>
              <p className='text-[10px] text-zinc-500 uppercase font-bold tracking-widest'>
                Para qual fatura/mês são esses gastos?
              </p>
              <input
                type='month'
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className='w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all [&::-webkit-calendar-picker-indicator]:invert'
              />

              <button
                onClick={handleSaveAll}
                disabled={saving}
                className='w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all mt-4'
              >
                {saving ? (
                  <Loader2 className='animate-spin w-5 h-5' />
                ) : (
                  <Save className='w-5 h-5' />
                )}
                CONFIRMAR E SALVAR
              </button>
            </div>
          )}
        </div>

        {/* ÁREA DE REVISÃO */}
        <div className='bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col h-[500px] sm:h-[600px] overflow-hidden shadow-2xl'>
          <div className='p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center text-xs'>
            <span className='font-bold text-zinc-200'>
              CONFERÊNCIA DOS DADOS
            </span>
            <span className='bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full'>
              {results.length} Itens
            </span>
          </div>

          <div className='flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar'>
            {results.length === 0 ? (
              <div className='h-full flex flex-col items-center justify-center text-zinc-600 opacity-50'>
                <Sparkles className='w-8 h-8 mb-2' />
                <p className='text-xs italic'>Aguardando processamento...</p>
              </div>
            ) : (
              results.map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-zinc-950 p-4 rounded-xl border-l-4 relative group transition-all ${item.type === 'income' ? 'border-l-emerald-500' : 'border-l-rose-500'}`}
                >
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className='absolute top-2 right-2 text-zinc-700 hover:text-rose-500 p-1'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                  <div className='grid grid-cols-2 gap-x-3 gap-y-4'>
                    <div className='col-span-2'>
                      <label className='text-[9px] font-bold text-zinc-500 uppercase mb-1 block'>
                        Descrição
                      </label>
                      <input
                        className='w-full bg-transparent text-sm text-white border-b border-zinc-800 focus:border-purple-500 outline-none pb-1'
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'description', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className='text-[9px] font-bold text-zinc-500 uppercase mb-1 block'>
                        Valor (R$)
                      </label>
                      <input
                        type='number'
                        className='w-full bg-transparent text-sm text-white border-b border-zinc-800 focus:border-purple-500 outline-none pb-1'
                        value={item.amount}
                        onChange={(e) =>
                          handleUpdateItem(
                            idx,
                            'amount',
                            parseFloat(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className='text-[9px] font-bold text-zinc-500 uppercase mb-1 block'>
                        Categoria
                      </label>
                      <select
                        className='w-full bg-zinc-900 text-xs text-zinc-200 border-b border-zinc-800 outline-none h-7'
                        value={item.category}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'category', e.target.value)
                        }
                      >
                        <option value=''>Selecione...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='text-[9px] font-bold text-zinc-500 uppercase mb-1 block'>
                        Data Real
                      </label>
                      <input
                        type='date'
                        className='w-full bg-transparent text-[10px] text-zinc-300 border-b border-zinc-800 outline-none [&::-webkit-calendar-picker-indicator]:invert'
                        value={item.date}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'date', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className='text-[9px] font-bold text-zinc-500 uppercase mb-1 block'>
                        Tipo
                      </label>
                      <select
                        className='w-full bg-zinc-900 text-[10px] text-zinc-300 border-b border-zinc-800 outline-none'
                        value={item.type}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'type', e.target.value)
                        }
                      >
                        <option value='expense'>Saída</option>
                        <option value='income'>Entrada</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
