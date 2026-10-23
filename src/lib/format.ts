export const inr = (n: number) =>
  "₹ " +
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export const inrCompact = (n: number) => {
  if (n >= 1e7) return "₹ " + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹ " + (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return "₹ " + (n / 1e3).toFixed(1) + "K";
  return "₹ " + n.toFixed(0);
};

export const shortDate = (d: string | number | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const timeAgo = (d: string | number | Date) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(d);
};

export const uid = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
