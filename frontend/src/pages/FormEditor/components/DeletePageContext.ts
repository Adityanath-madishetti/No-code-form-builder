import { createContext } from 'react';

export const DeletePageContext = createContext<
  (id: string, name: string) => void
>(() => {});
