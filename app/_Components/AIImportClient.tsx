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
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { processFileWithAI, saveTransactions } from '@/app/_actions/ai-import';
import { getCategories } from '@/app/_actions/categories';
import { currentMonthISO } from '@/app/utils/dates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import TypeIcon from './TypeIcon';
import { toast } from 'sonner';

// Server Actions aceitam no máximo 1 MB por requisição e o base64 aumenta o arquivo em ~33%
const MAX_IMPORT_FILE_BYTES = 700 * 1024;

export default function AIImportClient() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Último erro (arquivo inválido ou falha da IA), mostrado junto da área de
  // envio até um novo arquivo ser escolhido. Os toasts continuam iguais.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(
    currentMonthISO(),
  );

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    }
    loadCategories();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setErrorMessage(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    maxSize: MAX_IMPORT_FILE_BYTES,
    onDropRejected: () => {
      const message = 'Arquivo inválido. Envie PDF, JPG ou PNG de até 700 KB.';
      toast.error(message);
      setErrorMessage(message);
    },
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
    setErrorMessage(null);
    try {
      const base64 = await fileToBase64(files[0]);
      const data = await processFileWithAI(base64, files[0].type);
      if (data) setResults(data);
      else {
        toast.error('Não foi possível processar o arquivo.');
        setErrorMessage('Não foi possível processar o arquivo.');
      }
    } catch (error) {
      toast.error('Erro ao ler o arquivo.');
      setErrorMessage('Erro ao ler o arquivo.');
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

  // Itens sem categoria: o save cria a categoria pelo nome, e um nome vazio
  // viraria uma categoria sem nome no banco. Por isso o confirmar espera.
  const missingCategory = results
    .map((item, idx) => ({ item, number: idx + 1 }))
    .filter(({ item }) => !String(item.category ?? '').trim());

  const handleSaveAll = async () => {
    if (results.length === 0 || missingCategory.length > 0) return;
    setSaving(true);
    try {
      const res = await saveTransactions(results, selectedMonth);
      const skipped = res?.skipped ?? 0;
      toast.success(
        skipped > 0
          ? `${res.imported} importadas, ${skipped} duplicadas ignoradas.`
          : 'Transações importadas com sucesso!',
      );
      setResults([]);
      setFiles([]);
      router.push('/Dashboard');
    } catch (error) {
      toast.error('Erro ao salvar transações.');
    } finally {
      setSaving(false);
    }
  };

  // Rótulo dos campos de cada item: visível na lista empilhada; quando o
  // painel é largo (linha de tabela), o cabeçalho de colunas faz esse papel
  const fieldLabel = 'text-xs text-muted-foreground @3xl:sr-only';

  return (
    <div className='space-y-6'>
      {/* ENVIO + MÊS DE REFERÊNCIA (o mês só aparece quando há itens) */}
      <div
        className={`grid grid-cols-1 gap-6 ${results.length > 0 ? 'lg:grid-cols-2' : ''}`}
      >
        {/* CARD DE UPLOAD */}
        <Card className='p-5 sm:p-6 space-y-4'>
          {/* role="button": a área é focável e abre o seletor com Enter ou
              Espaço (o react-dropzone cuida do teclado) */}
          <div
            {...getRootProps({
              role: 'button',
              'aria-label': files[0]
                ? `Arquivo selecionado: ${files[0].name}. Trocar arquivo`
                : 'Selecionar PDF ou foto da fatura',
            })}
            className={cn(
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background border-2 border-dashed rounded-xl p-6 sm:p-10 cursor-pointer transition-colors flex flex-col items-center justify-center gap-3',
              // Arrastando: destaque roxo (IA); com arquivo: contorno ink
              isDragActive
                ? 'border-solid border-ai bg-ai/10'
                : files[0]
                  ? 'border-ink bg-surface'
                  : 'border-border-custom bg-surface-muted/40 hover:border-ink',
            )}
          >
            <input {...getInputProps()} />
            {files[0] ? (
              <FileText className='w-10 h-10 text-foreground' aria-hidden='true' />
            ) : (
              <UploadCloud
                className={cn(
                  'w-10 h-10',
                  isDragActive ? 'text-ai' : 'text-muted-foreground',
                )}
                aria-hidden='true'
              />
            )}
            <p className='text-sm font-medium text-center wrap-break-word max-w-full'>
              {files[0]?.name || 'Selecione o PDF ou Foto da Fatura'}
            </p>
          </div>

          {/* ERRO: mesmo estilo do erro do Assistente */}
          {errorMessage && (
            <div className='flex items-start gap-2 rounded-xl border-2 border-expense bg-surface p-3 text-sm font-medium'>
              <AlertTriangle
                className='w-4 h-4 shrink-0 mt-0.5 text-expense'
                aria-hidden='true'
              />
              {errorMessage}
            </div>
          )}

          <Button
            variant='ai'
            size='lg'
            onClick={handleProcess}
            disabled={loading || files.length === 0}
            className='w-full'
          >
            {loading ? (
              <Loader2 className='animate-spin w-4 h-4' />
            ) : (
              <Sparkles className='w-4 h-4' />
            )}
            {loading ? 'Analisando documento...' : 'Processar com IA'}
          </Button>
        </Card>

        {/* Anuncia o andamento para leitores de tela */}
        <p role='status' className='sr-only'>
          {loading
            ? 'Analisando documento...'
            : results.length > 0
              ? `${results.length} itens prontos para conferência.`
              : ''}
        </p>

        {/* SEÇÃO DO MÊS DE REFERÊNCIA */}
        {results.length > 0 && (
          <Card className='p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in'>
            <div className='flex items-center gap-2'>
              <CalendarDays className='w-4 h-4' aria-hidden='true' />
              <h3 className='text-sm font-bold lowercase'>
                <label htmlFor='import-month'>Mês de Referência</label>
              </h3>
            </div>
            <div className='space-y-1 text-xs text-muted-foreground font-medium'>
              <p>Para qual fatura/mês são esses gastos?</p>
              <p>As transações serão agrupadas no mês de referência escolhido.</p>
            </div>
            <Input
              id='import-month'
              type='month'
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            {/* Diz quais itens faltam antes de liberar o confirmar */}
            {missingCategory.length > 0 && (
              <div
                id='import-missing-category'
                className='flex items-start gap-2 rounded-xl border-2 border-expense bg-surface p-3 text-sm font-medium'
              >
                <AlertTriangle
                  className='w-4 h-4 shrink-0 mt-0.5 text-expense'
                  aria-hidden='true'
                />
                <div className='min-w-0'>
                  <p>Defina a categoria antes de salvar:</p>
                  <ul className='mt-1 list-disc pl-4 text-muted-foreground'>
                    {missingCategory.map(({ item, number }) => (
                      <li key={number} className='wrap-break-word'>
                        item {number}
                        {item.description ? ` (${item.description})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <Button
              size='lg'
              onClick={handleSaveAll}
              disabled={saving || missingCategory.length > 0}
              aria-describedby={
                missingCategory.length > 0
                  ? 'import-missing-category'
                  : undefined
              }
              className='w-full'
            >
              {saving ? (
                <Loader2 className='animate-spin w-5 h-5' />
              ) : (
                <Save className='w-5 h-5' />
              )}
              CONFIRMAR E SALVAR
            </Button>
          </Card>
        )}
      </div>

      {/* ÁREA DE REVISÃO: linha de tabela quando o painel é largo (@3xl),
          lista empilhada quando é estreito */}
      <Card className='@container flex flex-col'>
        <CardHeader>
          <h2 className='font-bold'>Conferência dos Dados</h2>
          <span className='rounded-md border-2 border-ink bg-surface px-2 py-0.5 text-xs font-bold tabular-nums'>
            {results.length} Itens
          </span>
        </CardHeader>

        {loading ? (
          // CARREGANDO
          <div className='min-h-60 flex flex-col items-center justify-center gap-3 p-8 text-center'>
            <Sparkles className='w-8 h-8 text-ai animate-pulse' aria-hidden='true' />
            <p className='text-sm font-medium text-muted-foreground lowercase'>
              Analisando documento...
            </p>
          </div>
        ) : results.length === 0 ? (
          // VAZIO
          <div className='min-h-60 flex flex-col items-center justify-center gap-3 p-8 text-center'>
            <Sparkles
              className='w-8 h-8 text-muted-foreground'
              aria-hidden='true'
            />
            <p className='text-sm font-medium text-muted-foreground'>
              Aguardando processamento...
            </p>
          </div>
        ) : (
          <div>
            {/* Cabeçalho de colunas: só no modo tabela */}
            <div
              aria-hidden='true'
              className={`hidden @3xl:grid ${rowGrid} px-4 py-3 border-b border-border-custom text-xs font-bold lowercase text-muted-foreground`}
            >
              <span />
              <span>Descrição</span>
              <span>Categoria</span>
              <span>Data Real</span>
              <span>Tipo</span>
              <span className='text-right'>
                Valor (<span className='normal-case'>R$</span>)
              </span>
              <span />
            </div>

            <ul className='divide-y divide-border-custom'>
              {results.map((item, idx) => (
                <li
                  key={idx}
                  className={`grid grid-cols-2 gap-3 p-4 items-end ${rowGrid} @3xl:items-center hover:bg-surface-muted/40 transition-colors`}
                >
                  {/* Tipo (seta) + remover: no topo da lista empilhada */}
                  <div className='col-span-2 flex items-center justify-between @3xl:col-span-1'>
                    <TypeIcon type={item.type} />
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveItem(idx)}
                      aria-label={`Remover item ${item.description || idx + 1}`}
                      className='size-8 text-muted-foreground hover:text-expense @3xl:hidden'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>

                  <div className='col-span-2 flex flex-col gap-1 @3xl:col-span-1 min-w-0'>
                    <Label htmlFor={`import-desc-${idx}`} className={fieldLabel}>
                      Descrição
                    </Label>
                    <Input
                      id={`import-desc-${idx}`}
                      size='sm'
                      className='h-9'
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateItem(idx, 'description', e.target.value)
                      }
                    />
                  </div>

                  <div className='flex flex-col gap-1 min-w-0'>
                    <Label
                      htmlFor={`import-category-${idx}`}
                      className={fieldLabel}
                    >
                      Categoria
                    </Label>
                    <Select
                      value={item.category}
                      onValueChange={(v) =>
                        handleUpdateItem(idx, 'category', v)
                      }
                    >
                      <SelectTrigger
                        id={`import-category-${idx}`}
                        size='sm'
                        // Sem categoria: contorno de erro (fieldVariants)
                        aria-invalid={!String(item.category ?? '').trim()}
                        className='h-9'
                      >
                        <SelectValue placeholder='Selecione...' />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex flex-col gap-1 min-w-0'>
                    <Label htmlFor={`import-date-${idx}`} className={fieldLabel}>
                      Data Real
                    </Label>
                    <DatePicker
                      id={`import-date-${idx}`}
                      size='sm'
                      value={item.date}
                      onChange={(v) => handleUpdateItem(idx, 'date', v)}
                      className='h-9 gap-2'
                    />
                  </div>

                  <div className='flex flex-col gap-1 min-w-0'>
                    <Label htmlFor={`import-type-${idx}`} className={fieldLabel}>
                      Tipo
                    </Label>
                    <Select
                      value={item.type}
                      onValueChange={(v) => handleUpdateItem(idx, 'type', v)}
                    >
                      <SelectTrigger
                        id={`import-type-${idx}`}
                        size='sm'
                        className='h-9'
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='expense'>Saída</SelectItem>
                        <SelectItem value='income'>Entrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='flex flex-col gap-1 min-w-0'>
                    <Label
                      htmlFor={`import-amount-${idx}`}
                      className={fieldLabel}
                    >
                      Valor (<span className='normal-case'>R$</span>)
                    </Label>
                    <Input
                      id={`import-amount-${idx}`}
                      type='number'
                      size='sm'
                      className={cn(
                        'h-9 text-right font-bold tabular-nums',
                        item.type === 'income' ? 'text-income' : 'text-expense',
                      )}
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

                  {/* Remover: última coluna no modo tabela */}
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleRemoveItem(idx)}
                    aria-label={`Remover item ${item.description || idx + 1}`}
                    className='hidden size-8 text-muted-foreground hover:text-expense @3xl:inline-flex'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

// Colunas do modo tabela: seta | descrição | categoria | data | tipo | valor | remover
const rowGrid =
  '@3xl:grid-cols-[2rem_minmax(0,1fr)_9rem_8.5rem_7rem_7.5rem_2rem]';
