const pkrFormatter = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPKR(amount: number): string {
  return `Rs. ${pkrFormatter.format(amount)}`;
}

export function parsePKR(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundPKR(amount: number): number {
  return Math.round(amount * 100) / 100;
}
