import { useDocuments } from "@/hooks/useDocuments";
import { DocumentList } from "@/components/Documents/DocumentList";

export default function AdminDocuments() {
  const { docs, loading, getUrl, removeDoc } = useDocuments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">All Documents</h1>
        <p className="text-sm text-muted-foreground">
          View all documents across the platform.
        </p>
      </div>
      <DocumentList
        documents={docs}
        loading={loading}
        getUrl={getUrl}
        onRemove={removeDoc}
      />
    </div>
  );
}
