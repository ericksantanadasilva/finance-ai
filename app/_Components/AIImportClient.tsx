'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Sparkles, UploadCloud, Loader2, Trash2, Save } from 'lucide-react';
import {
  processFileWithAI,
  saveTransactions,
  getCategories2,
} from '@/app/_actions/ai-import';

export default function AIImportClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carrega as categorias do banco de dados ao iniciar
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
      await saveTransactions(results);
      alert('Transações salvas com sucesso!');
      setResults([]);
      setFiles([]);
    } catch (error) {
      alert('Erro ao salvar transações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <div className='space-y-4'>
        <div className='bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-4'>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
              isDragActive
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className='w-10 h-10 text-zinc-500 mx-auto mb-2' />
            <p className='text-sm text-zinc-300 text-center'>
              {files[0]?.name || 'Clique ou arraste o extrato'}
            </p>
          </div>
          <button
            onClick={handleProcess}
            disabled={loading || files.length === 0}
            className='w-full bg-purple-600 py-3 rounded-lg flex justify-center gap-2 transition-all hover:bg-purple-500'
          >
            {loading ? (
              <Loader2 className='animate-spin' />
            ) : (
              <Sparkles className='w-4 h-4' />
            )}
            {loading ? 'Analisando documento...' : 'Processar com IA'}
          </button>
        </div>

        {results.length > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className='w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all'
          >
            {saving ? (
              <Loader2 className='animate-spin' />
            ) : (
              <Save className='w-5 h-5' />
            )}
            SALVAR {results.length} TRANSAÇÕES NO BANCO
          </button>
        )}
      </div>

      <div className='bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-[600px] overflow-hidden'>
        <div className='p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center'>
          <h3 className='text-sm font-bold text-zinc-200'>
            Revisar Transações
          </h3>
          <span className='text-xs text-zinc-500'>Ajuste antes de salvar</span>
        </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar'>
          {results.map((item, idx) => (
            <div
              key={idx}
              className={`bg-zinc-950 p-4 rounded-xl border-l-4 relative group ${
                item.type === 'income'
                  ? 'border-l-emerald-500'
                  : 'border-l-rose-500'
              }`}
            >
              <button
                onClick={() => handleRemoveItem(idx)}
                className='absolute top-2 right-2 text-zinc-600 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <Trash2 className='w-4 h-4' />
              </button>

              <div className='grid grid-cols-2 gap-3'>
                <div className='col-span-2'>
                  <label className='text-[10px] text-zinc-500 uppercase'>
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
                  <label className='text-[10px] text-zinc-500 uppercase'>
                    Valor (R$)
                  </label>
                  <input
                    type='number'
                    className='w-full bg-transparent text-sm text-white border-b border-zinc-800 outline-none pb-1'
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(
                        idx,
                        'amount',
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <label className='text-[10px] text-zinc-500 uppercase'>
                    Categoria
                  </label>
                  <select
                    className='w-full bg-zinc-900 text-sm text-zinc-200 border-b border-zinc-800 outline-none pb-1 h-7 cursor-pointer'
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
                  <label className='text-[10px] text-zinc-500 uppercase'>
                    Tipo
                  </label>
                  <select
                    className='w-full bg-zinc-900 text-xs text-zinc-300 border-b border-zinc-800 outline-none'
                    value={item.type}
                    onChange={(e) =>
                      handleUpdateItem(idx, 'type', e.target.value)
                    }
                  >
                    <option value='expense'>Saída</option>
                    <option value='income'>Entrada</option>
                  </select>
                </div>

                <div>
                  <label className='text-[10px] text-zinc-500 uppercase'>
                    Data
                  </label>
                  <input
                    type='date'
                    className='w-full bg-transparent text-xs text-zinc-300 border-b border-zinc-800 outline-none'
                    value={item.date}
                    onChange={(e) =>
                      handleUpdateItem(idx, 'date', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
