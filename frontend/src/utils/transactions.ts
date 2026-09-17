import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
};

export const formatDate = (date: string): string => {
  // Parse a data e converte para o timezone local (Brasil)
  const parsedDate = parseISO(date);
  // Adiciona o offset do timezone para garantir que a data UTC seja interpretada corretamente
  const localDate = new Date(
    parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000
  );
  return format(localDate, 'dd/MM/yyyy');
};
