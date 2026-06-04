import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/store/DataStore";
import type { Document, DocumentCategory, DocumentReferenceType } from "@/types/documents";
import { toast } from "sonner";

export function useDocuments() {
  const { user } = useAuth();
  const { data } = useDataStore();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs((rows ?? []) as Document[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const upload = useCallback(
    async (
      file: File,
      category: DocumentCategory,
      referenceType: DocumentReferenceType,
      referenceId?: string,
    ) => {
      if (!user) throw new Error("Not authenticated");
      const path = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(path, file);
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from("documents").insert({
        owner_id: user.id,
        name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        category,
        reference_type: referenceType,
        reference_id: referenceId ?? null,
      });
      if (dbErr) {
        await supabase.storage.from("documents").remove([path]);
        throw dbErr;
      }

      toast.success("Document uploaded");
      fetchDocs();
    },
    [user, fetchDocs],
  );

  const removeDoc = useCallback(
    async (doc: Document) => {
      const { error: storageErr } = await supabase.storage
        .from("documents")
        .remove([doc.file_path]);
      if (storageErr) console.error("Storage remove failed:", storageErr);

      await supabase.from("documents").delete().eq("id", doc.id);
      toast.success("Document deleted");
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    },
    [],
  );

  const getUrl = useCallback((doc: Document) => {
    const { data } = supabase.storage.from("documents").getPublicUrl(doc.file_path);
    return data.publicUrl;
  }, []);

  const byReference = useCallback(
    (refType: DocumentReferenceType, refId?: string) =>
      docs.filter(
        (d) =>
          d.reference_type === refType &&
          (refId ? d.reference_id === refId : true),
      ),
    [docs],
  );

  return { docs, loading, fetchDocs, upload, removeDoc, getUrl, byReference };
}

export function usePropertyDocuments(propertyId: string) {
  const { docs, loading, upload, removeDoc, getUrl } = useDocuments();
  return {
    documents: docs.filter(
      (d) => d.reference_type === "property" && d.reference_id === propertyId,
    ),
    loading,
    upload: (file: File, category: DocumentCategory) =>
      upload(file, category, "property", propertyId),
    removeDoc,
    getUrl,
  };
}

export function useTenantDocuments(tenantId: string) {
  const { docs, loading, upload, removeDoc, getUrl } = useDocuments();
  return {
    documents: docs.filter(
      (d) => d.reference_type === "tenant" && d.reference_id === tenantId,
    ),
    loading,
    upload: (file: File, category: DocumentCategory) =>
      upload(file, category, "tenant", tenantId),
    removeDoc,
    getUrl,
  };
}
