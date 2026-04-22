import { useDataStore } from "@/store/DataStore";
import { Badge } from "@/components/ui/badge";

export default function Orgs() {
  const { data } = useDataStore();
  const adminOrgs = data.adminOrgs;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Organizations</h1>
      <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-3">Org</th><th className="text-left p-3">Owner</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Users</th><th className="text-left p-3">MRR</th></tr>
            </thead>
            <tbody>
              {adminOrgs.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 font-medium">{o.name}</td>
                  <td className="p-3 text-muted-foreground">{o.owner}</td>
                  <td className="p-3"><Badge variant="outline">{o.plan}</Badge></td>
                  <td className="p-3">{o.users}</td>
                  <td className="p-3">${o.mrr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
