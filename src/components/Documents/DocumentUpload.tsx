import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, File, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentCategory } from "@/types/documents";

type Props = {
  onUpload: (file: File, category: DocumentCategory) => Promise<void>;
};

export function DocumentUpload({ onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file, category);
      setFile(null);
      setCategory("other");
    } catch (e: any) {
      console.error("Upload failed:", e);
    } finally {
      setBusy(false);
    }
  };

  const maxSize = 10 * 1024 * 1024;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.jpg,.png,.xls,.xlsx"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > maxSize) return;
              setFile(f);
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <File className="h-4 w-4 mr-2" />
          Choose file
        </Button>
        <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lease">Lease</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="noc">NOC</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleSubmit} disabled={!file || busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          Upload
        </Button>
      </div>
      {file && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <File className="h-3 w-3" />
          <span className="truncate max-w-[200px]">{file.name}</span>
          <span>({(file.size / 1024).toFixed(0)} KB)</span>
          <button onClick={() => setFile(null)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
