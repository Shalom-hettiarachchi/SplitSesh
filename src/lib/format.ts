export function money(n: number): string {
  return `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function qty(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}
