import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalBehaviorOptions = {
  // Liga/desliga o comportamento (ex.: o diálogo está aberto)
  isOpen: boolean;
  // Chamado ao apertar Esc
  onClose: () => void;
  // Para onde o foco volta ao fechar. Sem ele, volta para o elemento
  // que estava focado no momento em que o modal abriu.
  returnFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Comportamento de modal acessível: enquanto `isOpen` for true,
 * trava a rolagem da página, leva o foco para dentro do container,
 * prende o Tab nele e fecha com Esc. Ao fechar, devolve o foco.
 *
 * Retorna a ref que deve ser colocada no elemento que contém o modal.
 */
export function useModalBehavior<T extends HTMLElement>({
  isOpen,
  onClose,
  returnFocusRef,
}: ModalBehaviorOptions) {
  const containerRef = useRef<T>(null);

  // Sempre chama a versão mais recente de onClose sem reiniciar o efeito
  // (os pais costumam passar uma função nova a cada render).
  const handleClose = useEffectEvent(onClose);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    const returnTarget =
      returnFocusRef?.current ?? (document.activeElement as HTMLElement | null);

    // 1. Trava a rolagem da página por baixo
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusable = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    // 2. Leva o foco para dentro (respeita um autoFocus que já esteja lá dentro)
    if (!container?.contains(document.activeElement)) {
      getFocusable()[0]?.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Um componente aberto por cima (ex.: a lista do Select, num portal)
      // já tratou a tecla: o Esc fecha só ele e o Tab não é puxado de volta.
      if (e.defaultPrevented) return;

      // 3. Esc fecha
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;

      // 4. Tab e Shift+Tab circulam só dentro do container
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!container?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // 5. Ao fechar: desfaz tudo e devolve o foco
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnTarget?.focus();
    };
  }, [isOpen, returnFocusRef]);

  return containerRef;
}
