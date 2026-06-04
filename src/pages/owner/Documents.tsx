import { useDocuments } from "@/hooks/useDocuments";
import { DocumentUpload } from "@/components/Documents/DocumentUpload";
import { DocumentList } from "@/components/Documents/DocumentList";

export default function OwnerDocuments() {
  const { docs, loading, upload, removeDoc, getUrl } = useDocuments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload and manage leases, receipts, NOCs, and other documents.
        </p>
      </div>

      <DocumentUpload onUpload={upload} />

      <DocumentList
        documents={docs}
        loading={loading}
        getUrl={getUrl}
        onRemove={removeDoc}
      />
    </div>
  );
}
