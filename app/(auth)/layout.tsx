import React from 'react';

// O nome da função (LoginLayout) pode ser qualquer um,
// mas o "export default" é OBRIGATÓRIO.
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Você precisa retornar o {children} dentro de alguma tag
    <div className='w-full h-full'>{children}</div>
  );
}
