import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Loader2, Download } from "lucide-react";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { EmptyState } from "@/components/states/EmptyState";

import { LoadingState } from "@/components/states/LoadingState";

import { ErrorState } from "@/components/states/ErrorState";

type Lead = {
  id: string;

  email: string | null;

  name: string | null;

  company?: string | null;

  source?: string | null;

  message?: string | null;

  status:
    | "new"
    | "contacted"
    | "closed";

  created_at: string;
};

export default function AdminLeads() {
  const [rows, setRows] =
    useState<Lead[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [busy, setBusy] =
    useState<string | null>(
      null
    );

  const [viewMode, setViewMode] =
    useState<
      "active" | "closed"
    >("active");

  const [search, setSearch] =
    useState("");

  const [sourceFilter, setSourceFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const load = async () => {
    try {
      setLoading(true);

      setError(null);

      const {
        data,
        error,
      } = await supabase
        .from("leads")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        throw error;
      }

      setRows(
        (data ??
          []) as Lead[]
      );
    } catch (error: any) {
      console.error(
        "Failed loading leads:",
        error
      );

      setError(
        error?.message ??
          "Failed loading leads"
      );

      setRows([]);

      toast.error(
        "Failed loading leads"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus =
    async (
      id: string,
      status: Lead["status"]
    ) => {
      try {
        setBusy(id);

        const { error } =
          await supabase
            .from("leads")
            .update({
              status,
            } as any)
            .eq("id", id);

        if (error) {
          throw error;
        }

        toast.success(
          `Lead marked as ${status}`
        );

        await load();
      } catch (error: any) {
        console.error(
          "Lead status update failed:",
          error
        );

        toast.error(
          error?.message ??
            "Failed updating lead"
        );
      } finally {
        setBusy(null);
      }
    };

  const formatSource = (
    source?: string | null
  ) => {
    if (!source) {
      return "General";
    }

    return source
      .replaceAll("-", " ")
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (c) => c.toUpperCase()
      );
  };

  const uniqueSources =
    useMemo(() => {
      return Array.from(
        new Set(
          rows.map((r) =>
            formatSource(
              r.source
            )
          )
        )
      );
    }, [rows]);

  const filteredRows =
    useMemo(() => {
      return rows.filter(
        (lead) => {
          const isClosed =
            lead.status ===
            "closed";

          if (
            viewMode ===
              "active" &&
            isClosed
          ) {
            return false;
          }

          if (
            viewMode ===
              "closed" &&
            !isClosed
          ) {
            return false;
          }

          const matchesSearch =
            !search ||
            lead.name
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            lead.email
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesSource =
            sourceFilter ===
              "all" ||
            formatSource(
              lead.source
            ) ===
              sourceFilter;

          const matchesStatus =
            statusFilter ===
              "all" ||
            lead.status ===
              statusFilter;

          const createdDate =
            new Date(
              lead.created_at
            );

          const matchesFrom =
            !fromDate ||
            createdDate >=
              new Date(
                fromDate
              );

          const matchesTo =
            !toDate ||
            createdDate <=
              new Date(
                `${toDate}T23:59:59.999`
              );

          return (
            matchesSearch &&
            matchesSource &&
            matchesStatus &&
            matchesFrom &&
            matchesTo
          );
        }
      );
    }, [
      rows,
      viewMode,
      search,
      sourceFilter,
      statusFilter,
      fromDate,
      toDate,
    ]);

  const exportCSV = () => {
    try {
      const headers = [
        "Name",
        "Email",
        "Source",
        "Status",
        "Created",
      ];

      const csvRows =
        filteredRows.map(
          (lead) => [
            lead.name ?? "",
            lead.email ?? "",
            formatSource(
              lead.source
            ),
            lead.status,
            new Date(
              lead.created_at
            ).toLocaleString(),
          ]
        );

      const csvContent =
        [
          headers,
          ...csvRows,
        ]
          .map((e) =>
            e
              .map((v) =>
                `"${String(
                  v
                ).replaceAll(
                  `"`,
                  `""`
                )}"`
              )
              .join(",")
          )
          .join("\n");

      const blob =
        new Blob(
          [csvContent],
          {
            type: "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.setAttribute(
        "download",
        `${
          viewMode ===
          "closed"
            ? "closed"
            : "active"
        }-leads.csv`
      );

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      toast.success(
        "CSV downloaded"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed exporting CSV"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
            Leads
          </h1>

          <p className="text-muted-foreground mt-1 font-alt tracking-wide">
            Manage incoming sales
            and support leads.
          </p>
        </div>

        <Badge
          variant="outline"
          className="text-xs"
        >
          {
            filteredRows.length
          }{" "}
          lead
          {filteredRows.length !==
          1
            ? "s"
            : ""}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant={
            viewMode ===
            "active"
              ? "default"
              : "outline"
          }
          onClick={() =>
            setViewMode(
              "active"
            )
          }
        >
          Active Leads
        </Button>

        <Button
          variant={
            viewMode ===
            "closed"
              ? "default"
              : "outline"
          }
          onClick={() =>
            setViewMode(
              "closed"
            )
          }
        >
          Closed Leads
        </Button>

        <Button
          variant="outline"
          onClick={
            exportCSV
          }
          className="ml-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map((source) => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(
              e.target.value
            )
          }
        />

        <Input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(
              e.target.value
            )
          }
        />
      </div>

      {loading ? (
        <LoadingState title="Loading leads..." />
      ) : error ? (
        <ErrorState
          title="Unable to load leads"
          description={
            error
          }
          onRetry={load}
        />
      ) : filteredRows.length ===
        0 ? (
        <EmptyState
          title="No leads found"
          description="Try adjusting filters."
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">
                    Name
                  </th>

                  <th className="text-left p-3">
                    Email
                  </th>

                  <th className="text-left p-3">
                    Source
                  </th>

                  <th className="text-left p-3">
                    Status
                  </th>

                  <th className="text-left p-3">
                    Created
                  </th>

                  <th className="text-right p-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map(
                  (lead) => (
                    <tr
                      key={
                        lead.id
                      }
                      className="border-t"
                    >
                      <td className="p-3 font-medium">
                        {lead.name ||
                          "Unknown"}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {lead.email ||
                          "—"}
                      </td>

                      <td className="p-3">
                        {formatSource(
                          lead.source
                        )}
                      </td>

                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="capitalize"
                        >
                          {
                            lead.status
                          }
                        </Badge>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {new Date(
                          lead.created_at
                        ).toLocaleString()}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                View Details
                              </Button>
                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Lead Details
                                </DialogTitle>
                              </DialogHeader>

                              <div className="space-y-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    Name
                                  </div>

                                  <div className="font-medium">
                                    {lead.name ||
                                      "—"}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    Email
                                  </div>

                                  <div>
                                    {lead.email ||
                                      "—"}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    Company
                                  </div>

                                  <div>
                                    {lead.company ||
                                      "—"}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    Source
                                  </div>

                                  <div>
                                    {formatSource(
                                      lead.source
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    Status
                                  </div>

                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {
                                      lead.status
                                    }
                                  </Badge>
                                </div>

                                <div>
                                  <div className="text-muted-foreground mb-1">
                                    Message
                                  </div>

                                  <div className="rounded-md border p-3 whitespace-pre-wrap">
                                    {lead.message ||
                                      "No message provided."}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {lead.status ===
                            "new" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    busy ===
                                    lead.id
                                  }
                                >
                                  {busy ===
                                  lead.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Contacted"
                                  )}
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Mark as contacted?
                                  </AlertDialogTitle>

                                  <AlertDialogDescription>
                                    This lead will move to contacted status.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancel
                                  </AlertDialogCancel>

                                  <AlertDialogAction
                                    onClick={() =>
                                      setStatus(
                                        lead.id,
                                        "contacted"
                                      )
                                    }
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {lead.status ===
                            "contacted" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    busy ===
                                    lead.id
                                  }
                                >
                                  Close
                                </Button>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Close lead?
                                  </AlertDialogTitle>

                                  <AlertDialogDescription>
                                    This lead will be moved to closed leads.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancel
                                  </AlertDialogCancel>

                                  <AlertDialogAction
                                    onClick={() =>
                                      setStatus(
                                        lead.id,
                                        "closed"
                                      )
                                    }
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
