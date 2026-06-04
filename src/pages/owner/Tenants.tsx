import { useAuth } from "@/hooks/useAuth";

import {
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  useDataStore,
} from "@/store/DataStore";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

import { toast } from "sonner";

import {
  PauseCircle,
  PlayCircle,
  UserMinus,
  Trash2,
  Search,
  Plus,
  Pencil,
  LogOut,
  Lock,
  Download,
} from "lucide-react";

import {
  todayISO,
  toCSV,
} from "@/lib/format";

import {
  useCurrency,
} from "@/hooks/useCurrency";

import {
  usePlanLimits,
} from "@/hooks/usePlanLimits";

import {
  UpgradeDialog,
} from "@/components/UpgradeDialog";

import type {
  Tenant,
  TenantStatus,
} from "@/store/types";

import { supabase } from "@/integrations/supabase/client";

type FormState = {
  name: string;
  phone: string;
  email: string;
  propertyId: string;
  room: string;
  rent: string;
  deposit: string;
  startDate: string;
  status: TenantStatus;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  propertyId: "",
  room: "",
  rent: "",
  deposit: "",
  startDate: todayISO(),
  status: "active",
};

export default function Tenants() {
  const { user } = useAuth();
  const {
    data,
    addTenant,
    updateTenant,
    removeTenant,
    setTenantStatus,
    moveOutTenant,
  } = useDataStore();

  const tenants = useMemo(
    () =>
      Array.isArray(
        data?.tenants
      )
        ? data.tenants
        : [],
    [data?.tenants]
  );

  const properties = Array.isArray(
    data?.properties
  )
    ? data.properties
    : [];

  const transactions =
    Array.isArray(
      data?.transactions
    )
      ? data.transactions
      : [];

  const {
    fmt,
    symbol,
  } = useCurrency();

  const {
    tenantAtLimit,
    limits,
    activeTenants,
    planLabel,
    writesBlocked,
  } = usePlanLimits();

  const [q, setQ] =
    useState("");

  const [
    propertyFilter,
    setPropertyFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [open, setOpen] =
    useState(false);

  const [
    upgradeOpen,
    setUpgradeOpen,
  ] = useState(false);

  const [editId, setEditId] =
    useState<string | null>(
      null
    );

  const [form, setForm] =
    useState<FormState>(
      emptyForm
    );

  const [
  generatedCredentials,
  setGeneratedCredentials,
] = useState<{
  email: string;
  password: string;
} | null>(null);

const [
  creatingTenantAuth,
  setCreatingTenantAuth,
] = useState(false);

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const filtered =
    useMemo(() => {
      const s =
        q
          .trim()
          .toLowerCase();

      return tenants.filter(
        (t) => {
          if (
            propertyFilter !==
              "all" &&
            t?.propertyId !==
              propertyFilter
          ) {
            return false;
          }

          if (
            statusFilter !==
              "all" &&
            t?.status !==
              statusFilter
          ) {
            return false;
          }

          const haystack =
            `${t?.name ?? ""} ${
              t?.room ?? ""
            } ${
              t?.property ?? ""
            } ${
              t?.email ?? ""
            } ${
              t?.phone ?? ""
            }`.toLowerCase();

          if (
            s &&
            !haystack.includes(
              s
            )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      tenants,
      q,
      propertyFilter,
      statusFilter,
    ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const resetPage = () => setPage(0);
  useEffect(() => { resetPage(); }, [q, propertyFilter, statusFilter]);

  const openCreate =
    () => {
      if (
        tenantAtLimit
      ) {
        setUpgradeOpen(
          true
        );

        return;
      }

      setEditId(null);

      setForm(
        emptyForm
      );

      setOpen(true);
    };

  const openEdit = (
    t: Tenant
  ) => {
    if (!t?.id) {
      toast.error(
        "Tenant not found"
      );

      return;
    }

    setEditId(t.id);

    setForm({
      name:
        t?.name ?? "",
      phone:
        t?.phone ?? "",
      email:
        t?.email ?? "",
      propertyId:
        t?.propertyId ??
        "",
      room:
        t?.room ?? "",
      rent: String(
        Number(
          t?.rent ?? 0
        )
      ),
      deposit: String(
        Number(
          t?.deposit ??
            0
        )
      ),
      startDate:
        t?.startDate ??
        todayISO(),
      status:
        t?.status ??
        "active",
    });

    setOpen(true);
  };

  const phoneDigits =
    form.phone.replace(
      /\D/g,
      ""
    );

  const phoneError =
    form.phone.trim() ===
    ""
      ? ""
      : phoneDigits.length !==
        10
      ? "Phone must be exactly 10 digits"
      : "";

  const submit = async (
  e: React.FormEvent
) => {
    e.preventDefault();

    const name =
      form.name.trim();

    const room =
      form.room.trim();

    const email =
      form.email.trim();

    if (
      !name ||
      !form.propertyId ||
      !room
    ) {
      toast.error(
        "Missing details",
        {
          description:
            "Name, property and room are required.",
        }
      );

      return;
    }

    if (phoneError) {
      toast.error(
        "Invalid phone",
        {
          description:
            phoneError,
        }
      );

      return;
    }

    const rent =
      Math.max(
        0,
        Number(
          form.rent
        ) || 0
      );

    const deposit =
      Math.max(
        0,
        Number(
          form.deposit
        ) || 0
      );

    const phoneClean =
      phoneDigits;

    try {
      if (editId) {
        updateTenant(
          editId,
          {
            name,
            phone:
              phoneClean,
            email,
            propertyId:
              form.propertyId,
            room,
            rent,
            deposit,
            startDate:
              form.startDate,
            status:
              form.status,
          }
        );

        toast.success(
          "Tenant updated",
          {
            description:
              name,
          }
        );
      } else {
  if (email) {
    if (!user?.id) {
  throw new Error(
    "Owner session expired. Please login again."
  );
}
    setCreatingTenantAuth(
      true
    );

const {
  data: authResult,
  error: authError,
} = await supabase.functions.invoke(
  "create-tenant-user",
  {
    body: {
      email,
      name,
      phone:
        phoneClean,
      owner_id:
        user?.id,
      property_id:
        form.propertyId,
      room:
        form.room,
      rent:
        Number(form.rent) || 0,
      deposit:
        Number(form.deposit) || 0,
      start_date:
        form.startDate,
      status:
        form.status,
    },
  }
);

    if (authError) {
      console.error(
        "Tenant auth creation failed:",
        authError
      );

      throw new Error(
        authError.message ||
          "Failed to create tenant login"
      );
    }

    if (authResult?.error) {
      throw new Error(
        authResult.error
      );
    }

    setCreatingTenantAuth(
      false
    );

    setGeneratedCredentials(
      {
        email,
        password:
          "Check your email for invite link",
      }
    );
  } else {
    await addTenant({
      name,
      phone:
        phoneClean,
      email,
      propertyId:
        form.propertyId,
      room,
      rent,
      deposit,
      startDate:
        form.startDate,
      status:
        form.status,
    } as any);

    toast.success(
      "Tenant added",
      {
        description:
          name,
      }
    );
  }
}
      setOpen(false);

      setForm(
        emptyForm
      );

      setEditId(null);
    } catch (error: any) {
      console.error(
        "Tenant save failed:",
        error
      );

      toast.error(
        "Failed to save tenant",
        {
          description:
            error?.message,
        }
      );
    }
  };

  const togglePause = (
    t: Tenant
  ) => {
    try {
      const next =
        t.status ===
        "paused"
          ? "active"
          : "paused";

      setTenantStatus(
        t.id,
        next
      );

      toast.success(
        next ===
          "paused"
          ? "Billing paused"
          : "Billing resumed",
        {
          description:
            t.name,
        }
      );
    } catch {
      toast.error(
        "Failed updating tenant"
      );
    }
  };

  const deactivate = (
    t: Tenant
  ) => {
    try {
      setTenantStatus(
        t.id,
        "deactivated"
      );

      toast.success(
        "Tenant deactivated",
        {
          description:
            t.name,
        }
      );
    } catch {
      toast.error(
        "Failed to deactivate tenant"
      );
    }
  };

  const activate = (
    t: Tenant
  ) => {
    try {
      setTenantStatus(
        t.id,
        "active"
      );

      toast.success(
        "Tenant activated",
        {
          description:
            t.name,
        }
      );
    } catch {
      toast.error(
        "Failed to activate tenant"
      );
    }
  };

  const moveOut = (
    t: Tenant
  ) => {
    const dues =
      transactions
        .filter(
          (x) =>
            x?.tenantId ===
              t.id &&
            x?.status ===
              "pending"
        )
        .reduce(
          (sum, x) =>
            sum +
            Math.max(
              0,
              Number(
                x?.amount ??
                  0
              )
            ),
          0
        );

    if (dues > 0) {
      toast.error(
        "Settle dues first",
        {
          description: `${t.name} has ${fmt(
            dues
          )} pending.`,
        }
      );

      return;
    }

    try {
      moveOutTenant(
        t.id
      );

      toast.success(
        "Tenant moved out",
        {
          description: `${t.name} · room ${t.room} freed`,
        }
      );
    } catch {
      toast.error(
        "Move out failed"
      );
    }
  };

  const remove = (
    t: Tenant
  ) => {
    if (
      t.status !==
      "moved_out"
    ) {
      toast.error(
        "Cannot archive active tenant",
        {
          description:
            "Complete move-out first.",
        }
      );

      return;
    }

    try {
      removeTenant(
        t.id
      );

      toast.success(
        "Tenant archived",
        {
          description:
            t.name,
        }
      );
    } catch {
      toast.error(
        "Archive failed"
      );
    }
  };

  const statusColor = (
    s: TenantStatus
  ) =>
    s === "active"
      ? "bg-primary/15 text-primary"
      : s ===
        "paused"
      ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
      : s ===
        "moved_out"
      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">
            Tenants
          </h1>

          <p className="text-muted-foreground font-alt tracking-wide">
            Add tenants, assign rooms, and control billing.
          </p>
        </div>

        {tenantAtLimit &&
        !editId ? (
          <Button
            variant="hero"
            onClick={() =>
              setUpgradeOpen(
                true
              )
            }
          >
            <Lock className="h-4 w-4" />
            Add tenant
          </Button>
        ) : (
          <Dialog
            open={open}
            onOpenChange={
              setOpen
            }
          >
            <DialogTrigger asChild>
              <Button
                variant="hero"
                onClick={
                  openCreate
                }
              >
                <Plus className="h-4 w-4" />
                Add tenant
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editId
                    ? "Edit tenant"
                    : "New tenant"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={
                  submit
                }
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Full name
                    </Label>

                    <Input
                      required
                      value={
                        form.name
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            name: e
                              .target
                              .value,
                          }
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Phone
                    </Label>

                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={
                        form.phone
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            phone:
                              e.target.value
                                .replace(
                                  /\D/g,
                                  ""
                                )
                                .slice(
                                  0,
                                  10
                                ),
                          }
                        )
                      }
                    />

                    {phoneError && (
                      <p className="text-xs text-destructive">
                        {
                          phoneError
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Email
                  </Label>

                  <Input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(
                      e
                    ) =>
                      setForm(
                        {
                          ...form,
                          email:
                            e
                              .target
                              .value,
                        }
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Property
                    </Label>

                    <Select
                      value={
                        form.propertyId
                      }
                      onValueChange={(
                        v
                      ) =>
                        setForm(
                          {
                            ...form,
                            propertyId:
                              v,
                          }
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>

                      <SelectContent>
                        {properties.map(
                          (
                            p
                          ) => (
                            <SelectItem
                              key={
                                p.id
                              }
                              value={
                                p.id
                              }
                            >
                              {p.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Room / unit
                    </Label>

                    <Input
                      required
                      value={
                        form.room
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            room:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Rent (
                      {
                        symbol
                      }
                      )
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      required
                      value={
                        form.rent
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            rent:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Deposit (
                      {
                        symbol
                      }
                      )
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      value={
                        form.deposit
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            deposit:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>
                      Start date
                    </Label>

                    <Input
                      type="date"
                      required
                      value={
                        form.startDate
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            startDate:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Status
                    </Label>

                    <Select
                      value={
                        form.status
                      }
                      onValueChange={(
                        v
                      ) =>
                        setForm(
                          {
                            ...form,
                            status:
                              v as TenantStatus,
                          }
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="active">
                          Active
                        </SelectItem>

                        <SelectItem value="paused">
                          Paused
                        </SelectItem>

                        <SelectItem value="deactivated">
                          Deactivated
                        </SelectItem>

                        <SelectItem value="moved_out">
                          Moved out
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={
                      creatingTenantAuth
                      }
                    >
                    {creatingTenantAuth
                      ? "Creating..."
                      : editId
                      ? "Save"
                      : "Create"}
                    </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={
            setUpgradeOpen
          }
          reason={
            writesBlocked
              ? "Your plan is paused. Reactivate to add more tenants."
              : `${planLabel} includes ${
                  limits.maxTenants ===
                  Infinity
                    ? "unlimited"
                    : limits.maxTenants
                } active tenants.`
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search tenants…"
            value={q}
            onChange={(e) =>
              setQ(
                e.target.value
              )
            }
            className="pl-9"
          />
        </div>

        <Select
          value={
            propertyFilter
          }
          onValueChange={
            setPropertyFilter
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All properties" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All properties
            </SelectItem>

            {properties.map(
              (p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                >
                  {p.name}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select
          value={
            statusFilter
          }
          onValueChange={
            setStatusFilter
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All statuses
            </SelectItem>

            <SelectItem value="active">
              Active
            </SelectItem>

            <SelectItem value="paused">
              Paused
            </SelectItem>

            <SelectItem value="deactivated">
              Deactivated
            </SelectItem>

            <SelectItem value="moved_out">
              Moved out
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="ml-auto"
          disabled={
            filtered.length ===
            0
          }
          onClick={() => {
            const csv =
  toCSV(
    filtered,
    [
      { key: "name",     header: "Name" },
      { key: "email",    header: "Email" },
      { key: "phone",    header: "Phone" },
      { key: "property", header: "Property" },
      { key: "room",     header: "Room" },
      { key: "rent",     header: "Rent" },
      { key: "status",   header: "Status" },
      { key: "startDate",header: "Start Date" },
    ]
  );

const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
const url  = URL.createObjectURL(blob);
const a    = document.createElement("a");
a.href     = url;
a.download = `tenants-${todayISO()}.csv`;
a.click();
URL.revokeObjectURL(url);

            toast.success(
              "Exported"
            );
          }}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {filtered.length ===
      0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="font-display font-semibold">
            No tenants found
          </div>

          <div className="text-sm text-muted-foreground">
            Try adjusting filters or add your first tenant.
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-gradient-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">
                    Name
                  </th>

                  <th className="text-left p-3">
                    Property
                  </th>

                  <th className="text-left p-3">
                    Room
                  </th>

                  <th className="text-left p-3">
                    Rent
                  </th>

                  <th className="text-left p-3">
                    Status
                  </th>

                  <th className="text-right p-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="stagger-children">
                {paginated.map(
                  (t) => {
                    const isInactive =
                      t.status ===
                        "deactivated" ||
                      t.status ===
                        "moved_out";

                    return (
                      <tr
                        key={
                          t.id
                        }
                        className="border-t border-border"
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {
                              t.name
                            }
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {t.email ||
                              t.phone}
                          </div>
                        </td>

                        <td className="p-3">
                          {t.property ||
                            "—"}
                        </td>

                        <td className="p-3">
                          {
                            t.room
                          }
                        </td>

                        <td className="p-3">
                          {fmt(
                            Number(
                              t.rent ??
                                0
                            )
                          )}
                        </td>

                        <td className="p-3">
                          <Badge
                            className={statusColor(
                              t.status
                            )}
                            variant="outline"
                          >
                            {t.status.replace(
                              "_",
                              " "
                            )}
                          </Badge>
                        </td>

                        <td className="p-3">
                          <TooltipProvider delayDuration={120}>
  <div className="flex items-center justify-end gap-1">
    
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => openEdit(t)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TooltipTrigger>

      <TooltipContent>
        Edit
      </TooltipContent>
    </Tooltip>

    {isInactive ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => activate(t)}
          >
            <PlayCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>

        <TooltipContent>
          Activate
        </TooltipContent>
      </Tooltip>
    ) : (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => togglePause(t)}
          >
            {t.status === "paused" ? (
              <PlayCircle className="h-4 w-4" />
            ) : (
              <PauseCircle className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>

        <TooltipContent>
          {t.status === "paused"
            ? "Resume billing"
            : "Pause billing"}
        </TooltipContent>
      </Tooltip>
    )}

    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => moveOut(t)}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </TooltipTrigger>

      <TooltipContent>
        Move out
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => deactivate(t)}
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      </TooltipTrigger>

      <TooltipContent>
        Deactivate
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          disabled={t.status !== "moved_out"}
          onClick={() => remove(t)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TooltipTrigger>

      <TooltipContent>
        Archive
      </TooltipContent>
    </Tooltip>

  </div>
</TooltipProvider>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={safePage <= 0} onClick={() => setPage(safePage - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
      <Dialog
        open={
          !!generatedCredentials
          }
        onOpenChange={() =>
          setGeneratedCredentials(
            null
            )
          }
        >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Tenant login created
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">
                  Email
                </div>

                <div className="font-medium break-all">
                  {
                    generatedCredentials?.email
                  }
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">
                  Temporary password
                </div>

                <div className="font-medium">
                  {
                    generatedCredentials?.password
                  }
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${generatedCredentials?.email}\nPassword: ${generatedCredentials?.password}`
                );

                toast.success(
                  "Credentials copied"
                );
              }}
            >
              Copy credentials
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Share these credentials securely. Tenant can change password later.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
