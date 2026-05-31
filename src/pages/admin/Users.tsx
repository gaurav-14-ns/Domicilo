import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Ban,
  CheckCircle2,
  Search,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Checkbox,
} from "@/components/ui/checkbox";

import { toast } from "sonner";

type Sub = {
  plan: string;
  status: string;
};

type Row = {
  id: string;

  email: string | null;

  full_name: string | null;

  role: string;

  status: string;

  propertyCount?: number;

  tenantCount?: number;

  sub?: Sub;
};

export default function Users() {

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    users,
    setUsers,
  ] = useState<Row[]>(
    []
  );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("all");

  const [
    suspendedFilter,
    setSuspendedFilter,
  ] = useState("all");

  const [
    planFilter,
    setPlanFilter,
  ] = useState("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<
    string[]
  >([]);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [pendingAction, setPendingAction] = useState<{
    ids: string[];
    status: "active" | "suspended";
  } | null>(null);

  async function loadUsers() {

    try {

      setLoading(
        true
      );

      const {
        data: profiles,
        error:
          profilesError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "id, email, full_name, suspended"
          );

      if (
        profilesError
      ) {
        throw profilesError;
      }

      const {
        data: roles,
        error:
          rolesError,
      } =
        await supabase
          .from(
            "user_roles"
          )
          .select(
            "user_id, role"
          );

      if (
        rolesError
      ) {
        throw rolesError;
      }

      const {
        data:
          properties,
      } =
        await supabase
          .from(
            "properties"
          )
          .select(
            "owner_id"
          );

      const {
        data:
          tenants,
      } =
        await supabase
          .from(
            "tenants"
          )
          .select(
            "owner_id"
          );

      const {
        data:
          subscriptions,
      } =
        await supabase
          .from(
            "subscriptions"
          )
          .select(
            "owner_id, plan, status"
          );

      const rows:
        Row[] =
        (
          profiles ??
          []
        ).map(
          (
            p
          ) => {

            const role =
              roles?.find(
                (
                  r
                ) =>
                  r.user_id ===
                  p.id
              );

            const propertyCount =
              properties?.filter(
                (
                  pr
                ) =>
                  pr.owner_id ===
                  p.id
              )
                .length ??
              0;

            const tenantCount =
              tenants?.filter(
                (
                  t
                ) =>
                  t.owner_id ===
                  p.id
              )
                .length ??
              0;

            const sub =
              subscriptions?.find(
                (
                  s
                ) =>
                  s.owner_id ===
                  p.id
              );

            return {

              id: p.id,

              email:
                p.email,

              full_name:
                p.full_name,

              role:
                role?.role ??
                "-",

              status:
                p.suspended
                  ? "suspended"
                  : "active",

              propertyCount,

              tenantCount,

              sub,
            };
          }
        );

      setUsers(
        rows
      );

    } catch (
      err: any
    ) {

      console.error(
        err
      );

      toast.error(
        "Failed to load users"
      );

    } finally {

      setLoading(
        false
      );
    }
  }

  useEffect(() => {

    loadUsers();

  }, []);

  const filteredUsers =
    useMemo(() => {

      return users
        .filter(
          (
            r
          ) => {

            const q =
              query.toLowerCase();

            const matchesQuery =
              !query ||
              r.full_name
                ?.toLowerCase()
                .includes(
                  q
                ) ||
              r.email
                ?.toLowerCase()
                .includes(
                  q
                );

            const matchesRole =
              roleFilter ===
                "all" ||
              r.role ===
                roleFilter;

            const matchesStatus =
              suspendedFilter ===
                "all" ||
              r.status ===
                suspendedFilter;

            const matchesPlan =
              planFilter ===
                "all" ||
              r.sub?.plan ===
                planFilter;

            const matchesBilling =
              statusFilter ===
                "all" ||
              r.sub?.status ===
                statusFilter;

            return (
              matchesQuery &&
              matchesRole &&
              matchesStatus &&
              matchesPlan &&
              matchesBilling
            );
          }
        );

    }, [
      users,
      query,
      roleFilter,
      suspendedFilter,
      planFilter,
      statusFilter,
    ]);

  const allSelected =
    filteredUsers.length >
      0 &&
    filteredUsers.every(
      (
        u
      ) =>
        selectedIds.includes(
          u.id
        )
    );

  function toggleSelectAll() {

    if (
      allSelected
    ) {

      setSelectedIds(
        []
      );

      return;
    }

    setSelectedIds(
      filteredUsers.map(
        (
          u
        ) => u.id
      )
    );
  }

  function toggleSelect(
    id: string
  ) {

    setSelectedIds(
      (
        prev
      ) =>
        prev.includes(
          id
        )
          ? prev.filter(
              (
                x
              ) =>
                x !== id
            )
          : [
              ...prev,
              id,
            ]
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Users
          </h1>

          <p className="text-muted-foreground font-alt tracking-wide">
            Manage all platform users.
          </p>
        </div>

        <div className="relative w-full lg:w-80">

          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={
              query
            }
            onChange={(
              e
            ) =>
              setQuery(
                e
                  .target
                  .value
              )
            }
            placeholder="Search name or email..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-3">

  <div>
    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
      Filters
    </h2>
  </div>

  <div className="grid gap-3 md:grid-cols-4">

    {/* ROLE */}

    <div className="space-y-2">

      <p className="text-sm font-medium text-muted-foreground">
        Role
      </p>

      <Select
        value={
          roleFilter
        }
        onValueChange={
          setRoleFilter
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Role" />
        </SelectTrigger>

        <SelectContent>

          <SelectItem value="all">
            All roles
          </SelectItem>

          <SelectItem value="owner">
            Owners
          </SelectItem>

          <SelectItem value="tenant">
            Tenants
          </SelectItem>

        </SelectContent>
      </Select>

    </div>

    {/* STATUS */}

    <div className="space-y-2">

      <p className="text-sm font-medium text-muted-foreground">
        Status
      </p>

      <Select
        value={
          suspendedFilter
        }
        onValueChange={
          setSuspendedFilter
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>

          <SelectItem value="all">
            All statuses
          </SelectItem>

          <SelectItem value="active">
            Active
          </SelectItem>

          <SelectItem value="suspended">
            Suspended
          </SelectItem>

        </SelectContent>
      </Select>

    </div>

    {/* SUBSCRIPTION */}

    <div className="space-y-2">

      <p className="text-sm font-medium text-muted-foreground">
        Subscription
      </p>

      <Select
        value={
          planFilter
        }
        onValueChange={
          setPlanFilter
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Subscription" />
        </SelectTrigger>

        <SelectContent>

          <SelectItem value="all">
            All subscriptions
          </SelectItem>

          <SelectItem value="trial">
            Trial
          </SelectItem>

          <SelectItem value="starter">
            Starter
          </SelectItem>

          <SelectItem value="growth">
            Growth
          </SelectItem>

          <SelectItem value="scale">
            Scale
          </SelectItem>

        </SelectContent>
      </Select>

    </div>

    {/* BILLING */}

    <div className="space-y-2">

      <p className="text-sm font-medium text-muted-foreground">
        Billing
      </p>

      <Select
        value={
          statusFilter
        }
        onValueChange={
          setStatusFilter
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Billing" />
        </SelectTrigger>

        <SelectContent>

          <SelectItem value="all">
            All billing
          </SelectItem>

          <SelectItem value="active">
            Active
          </SelectItem>

          <SelectItem value="cancelled">
            Cancelled
          </SelectItem>

          <SelectItem value="expired">
            Expired
          </SelectItem>

        </SelectContent>
      </Select>
      </div>
    </div>
        </div>

      <div className="flex flex-wrap gap-3">

        <Button
  variant="destructive"
  onClick={() => {

    if (
      selectedIds.length === 0
    ) {

      toast.error(
        "Select at least one user"
      );

      return;
    }

    setPendingAction({
      ids: selectedIds,
      status: "suspended",
    });

    setConfirmOpen(
      true
    );
  }}
>
          <Ban className="mr-2 h-4 w-4" />
          Suspend Selected
        </Button>

        <Button
  onClick={() => {

    if (
      selectedIds.length === 0
    ) {

      toast.error(
        "Select at least one user"
      );

      return;
    }

    setPendingAction({
      ids: selectedIds,
      status: "active",
    });

    setConfirmOpen(
      true
    );
  }}
>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Activate Selected
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">

        <Table>

          <TableHeader>

            <TableRow>

              <TableHead className="w-[50px]">

                <Checkbox
                  checked={
                    allSelected
                  }
                  onCheckedChange={
                    toggleSelectAll
                  }
                />

              </TableHead>

              <TableHead>
                Name
              </TableHead>

              <TableHead>
                Email
              </TableHead>

              <TableHead>
                Role
              </TableHead>

              <TableHead>
                Subscription
              </TableHead>

              <TableHead>
                Billing
              </TableHead>

              <TableHead>
                Properties
              </TableHead>

              <TableHead>
                Tenants
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead>
                Actions
              </TableHead>

            </TableRow>

          </TableHeader>

          <TableBody>

            {filteredUsers.map(
              (
                u
              ) => (

                <TableRow
                  key={
                    u.id
                  }
                >

                  <TableCell>

                    <Checkbox
                      checked={selectedIds.includes(
                        u.id
                      )}
                      onCheckedChange={() =>
                        toggleSelect(
                          u.id
                        )
                      }
                    />

                  </TableCell>

                  <TableCell className="font-medium">

                    {u.full_name ??
                      "-"}

                  </TableCell>

                  <TableCell>

                    {u.email ??
                      "-"}

                  </TableCell>

                  <TableCell>

                    <Badge variant="outline">
                      {u.role}
                    </Badge>

                  </TableCell>

                  <TableCell>

                    {u.role ===
                    "owner"
                      ? (
                          u.sub
                            ?.plan ??
                          "-"
                        )
                      : "-"}

                  </TableCell>

                  <TableCell>

                    {u.role ===
                    "owner"
                      ? (
                          u.sub
                            ?.status ??
                          "-"
                        )
                      : "-"}

                  </TableCell>

                  <TableCell>

                    {u.role ===
                    "owner"
                      ? u.propertyCount
                      : "-"}

                  </TableCell>

                  <TableCell>

                    {u.role ===
                    "owner"
                      ? u.tenantCount
                      : "-"}

                  </TableCell>

                  <TableCell>

                    <Badge
                      variant={
                        u.status ===
                        "suspended"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {u.status}
                    </Badge>

                  </TableCell>

                  <TableCell>

                    {u.role ===
                    "admin" ? (

                      <Badge variant="secondary">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Protected
                      </Badge>

                    ) : (

                      <Button
                        size="sm"
                        variant={
                          u.status ===
                          "suspended"
                            ? "default"
                            : "destructive"
                        }
                        onClick={() => {

  const nextStatus =
    u.status ===
    "suspended"
      ? "active"
      : "suspended";

  setPendingAction({
    ids: [u.id],
    status:
      nextStatus,
  });

  setConfirmOpen(
    true
  );
}}
                      >
                        {u.status ===
                        "suspended"
                          ? "Activate"
                          : "Suspend"}
                      </Button>

                    )}

                  </TableCell>

                </TableRow>
              )
            )}

            {!loading &&
              filteredUsers.length ===
                0 && (

                <TableRow>

                  <TableCell
                    colSpan={
                      10
                    }
                    className="text-center py-10 text-muted-foreground"
                  >
                    No users found.
                  </TableCell>

                </TableRow>
              )}

          </TableBody>

        </Table>

      </div>

          <AlertDialog
        open={confirmOpen}
        onOpenChange={
          setConfirmOpen
        }
      >

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>

              {pendingAction?.status ===
              "suspended"
                ? "Suspend users?"
                : "Activate users?"}

            </AlertDialogTitle>

            <AlertDialogDescription>

              {pendingAction?.status ===
              "suspended"
                ? "Selected users will immediately lose platform access."
                : "Selected users will regain platform access."}

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={async () => {

                if (
                  !pendingAction
                ) {
                  return;
                }

                const targets =
                  users.filter(
                    (
                      u
                    ) =>
                      pendingAction.ids.includes(
                        u.id
                      ) &&
                      u.role !==
                        "admin"
                  );

                const ids =
  targets.map(
    (
      u
    ) => u.id
  );

if (
  ids.length === 0
) {

  toast.error(
    "Admin accounts cannot be modified"
  );

  return;
}

                const {
                  error,
                } =
                  await supabase
                    .from(
                      "profiles"
                    )
                    .update({
                      status:
  pendingAction.status ===
  "suspended"
    ? "suspended"
    : "active",
                    })
                    .in(
                      "id",
                      ids
                    );

                if (
                  error
                ) {

                  toast.error(
                    "Failed to update users"
                  );

                  return;
                }

                toast.success(
                  pendingAction.status ===
                    "suspended"
                    ? "Users suspended"
                    : "Users activated"
                );

                setSelectedIds(
                  []
                );

                setPendingAction(
                  null
                );

                loadUsers();
              }}
            >

              Confirm

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>
  );
}
