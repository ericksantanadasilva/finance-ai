// Função para extrair iniciais e definir a cor
export const getAvatarData = (name: string = 'Usuário') => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Cores sólidas dos tokens, cada uma com sua cor de texto legível
  const themes = [
    'bg-highlight text-highlight-foreground',
    'bg-ai text-ai-foreground',
    'bg-band text-band-foreground',
  ];

  const charSum = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const theme = themes[charSum % themes.length];

  return { initials, theme };
};
