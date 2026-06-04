import { FileText, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Document } from "@/types/documents";

type Props = {
  documents: Document[];
  loading: boolean;
  getUrl: (doc: Document) => string;
  onRemove: (doc: Document) => Promise<void>;
};

const categoryLabel: Record<string, string> = {
  lease: "Lease",
  receipt: "Receipt",
  noc: "NOC",
  other: "Other",
};

export function DocumentList({ documents, loading, getUrl, onRemove }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-medium">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {categoryLabel[doc.category] ?? doc.category} &middot;{" "}
                {(doc.file_size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={getUrl(doc)} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onRemove(doc)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
