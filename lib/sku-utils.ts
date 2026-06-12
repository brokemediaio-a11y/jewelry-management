export function getCategoryCode(categoryName: string): string {
  const code = categoryName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  return code.padEnd(3, 'X');
}

export function formatDateForSku(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function generateSKU(categoryName: string, sequence: number, date = new Date()): string {
  const categoryCode = getCategoryCode(categoryName);
  const datePart = formatDateForSku(date);
  const seqPart = String(sequence).padStart(4, '0');
  return `${categoryCode}-${datePart}-${seqPart}`;
}
