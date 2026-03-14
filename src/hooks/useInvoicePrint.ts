export const useInvoicePrint = () => {
  const printInvoice = () => {
    window.print();
  };

  return { printInvoice };
};
