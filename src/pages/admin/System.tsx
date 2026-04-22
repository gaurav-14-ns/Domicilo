export default function System() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">System</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { l: "API uptime", v: "99.98%" },
          { l: "Avg response", v: "84ms" },
          { l: "Errors (24h)", v: "12" },
          { l: "Active sessions", v: "1,402" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-gradient-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className="text-2xl font-bold font-display mt-1">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
