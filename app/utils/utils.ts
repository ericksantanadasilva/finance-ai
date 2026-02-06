// Função para extrair iniciais e definir a cor
export const getAvatarData = (name: string = 'Usuário') => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const themes = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-yellow-500 to-orange-600',
  ];

  const charSum = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const theme = themes[charSum % themes.length];

  return { initials, theme };
};
