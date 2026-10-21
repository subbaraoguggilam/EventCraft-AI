/**
 * Indian currency (INR / ₹) formatting utilities.
 */
export const formatINR = (amount?: number | null): string => {
  if (amount == null || isNaN(amount)) return '₹0'
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}
