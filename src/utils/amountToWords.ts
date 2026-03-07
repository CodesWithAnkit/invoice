/**
 * Extremely minimal amount to words utility for MVP.
 * In a real app, use a library like 'number-to-words'.
 */
export const amountToWords = (amount: number): string => {
  if (amount === 0) return "Zero Only";
  
  // Minimal implementation for demonstration
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  });
  
  const formatted = formatter.format(amount);
  return `${formatted} (Amount in Words Placeholder)`;
};
