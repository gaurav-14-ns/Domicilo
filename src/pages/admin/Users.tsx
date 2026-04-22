export default function AdminUsers() {
  const users = [
    { e: "demo@domicilo.com", role: "owner", org: "Domicilo Demo" },
    { e: "sara@example.com", role: "tenant", org: "Domicilo Demo" },
    { e: "ceo@acme.com", role: "owner", org: "Acme Properties" },
    { e: "admin@platform.io", role: "admin", org: "—" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Users</h1>
      <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="text-left p-3">Org</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.e} className="border-t border-border">
                <td className="p-3 font-medium">{u.e}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3 text-muted-foreground">{u.org}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
