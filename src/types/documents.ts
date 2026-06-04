export type DocumentCategory = "lease" | "receipt" | "noc" | "other";
export type DocumentReferenceType = "property" | "tenant" | "general";

export type Document = {
  id: string;
  owner_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: DocumentCategory;
  reference_type: DocumentReferenceType;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
};
