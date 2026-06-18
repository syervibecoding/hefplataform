interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}

export default function StatCard({ label, value, sub, colorClass = "text-foreground" }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-5 transition-all hover:border-border/80 hover:-translate-y-px">
      <div className="text-[10px] md:text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-2xl md:text-[28px] font-bold mt-1.5 font-mono break-words ${colorClass}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
