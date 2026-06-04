import { useDocuments } from "@/hooks/useDocuments";
import { DocumentList } from "@/components/Documents/DocumentList";
import { useAuth } from "@/hooks/useAuth";

export default function TenantDocuments() {
  const { user } = useAuth();
  const { docs, loading, getUrl, removeDoc } = useDocuments();
  const myDocs = docs.filter(
    (d) =>
      d.reference_type === "tenant" &&
      d.reference_id === user?.id,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">My Documents</h1>
        <p className="text-sm text-muted-foreground">
          Documents shared by your owner.
        </p>
      </div>
      <DocumentList
        documents={myDocs}
        loading={loading}
        getUrl={getUrl}
        onRemove={removeDoc}
      />
    </div>
  );
}
