import {
  useMemo,
  useState,
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
  Plus,
  Home,
  Trash2,
  Pencil,
  Search,
  Lock,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  usePlanLimits,
} from "@/hooks/usePlanLimits";

import {
  UpgradeDialog,
} from "@/components/UpgradeDialog";

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
  toast,
} from "sonner";

interface FormState {
  name: string;

  address: string;

  units: string;

  occupied: string;
}

const empty: FormState = {
  name: "",

  address: "",

  units: "10",

  occupied: "0",
};

export default function Properties() {
  const {
    data,
    addProperty,
    updateProperty,
    removeProperty,
  } = useDataStore();

  const list = Array.isArray(
    data?.properties
  )
    ? data.properties
    : [];

  const {
    propertyAtLimit,
    limits,
    propertyCount,
    planLabel,
    writesBlocked,
  } = usePlanLimits();

  const [q, setQ] =
    useState("");

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

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState<FormState>(
      empty
    );

  const filtered =
    useMemo(() => {
      const s =
        q
          .trim()
          .toLowerCase();

      if (!s) {
        return list;
      }

      return list.filter(
        (p) =>
          `${p?.name ?? ""} ${
            p?.address ?? ""
          }`
            .toLowerCase()
            .includes(s)
      );
    }, [list, q]);

  const openCreate =
    () => {
      if (
        propertyAtLimit
      ) {
        setUpgradeOpen(
          true
        );

        return;
      }

      setEditId(null);

      setForm(empty);

      setOpen(true);
    };

  const openEdit = (
    id: string
  ) => {
    const p = list.find(
      (x) =>
        x?.id === id
    );

    if (!p) {
      toast.error(
        "Property not found"
      );

      return;
    }

    setEditId(id);

    setForm({
      name:
        p?.name ?? "",

      address:
        p?.address ??
        "",

      units: String(
        Number(
          p?.units ?? 0
        )
      ),

      occupied: String(
        Number(
          p?.occupied ??
            0
        )
      ),
    });

    setOpen(true);
  };

  const submit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const name =
      form.name.trim();

    const address =
      form.address.trim();

    const units =
      Math.max(
        0,
        Number(
          form.units
        ) || 0
      );

    const occupied =
      Math.min(
        units,
        Math.max(
          0,
          Number(
            form.occupied
          ) || 0
        )
      );

    if (
      !name ||
      !address
    ) {
      toast.error(
        "Missing details",
        {
          description:
            "Name and address are required.",
        }
      );

      return;
    }

    if (units <= 0) {
      toast.error(
        "Invalid units",
        {
          description:
            "Units must be greater than 0.",
        }
      );

      return;
    }

    try {
      setSaving(true);

      if (editId) {
        updateProperty(
          editId,
          {
            name,
            address,
            units,
          }
        );

        toast.success(
          "Property updated",
          {
            description:
              name,
          }
        );
      } else {
        addProperty({
          name,
          address,
          units,
          occupied,
        });

        toast.success(
          "Property added",
          {
            description:
              name,
          }
        );
      }

      setOpen(false);

      setForm(empty);

      setEditId(null);
    } catch (error: any) {
      console.error(
        "Property save failed:",
        error
      );

      toast.error(
        "Failed to save property",
        {
          description:
            error?.message,
        }
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = (
    id: string,
    n: string
  ) => {
    try {
      removeProperty(id);

      toast.success(
        "Property removed",
        {
          description:
            n,
        }
      );
    } catch (error: any) {
      console.error(
        "Property removal failed:",
        error
      );

      toast.error(
        "Failed to remove property",
        {
          description:
            error?.message,
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Properties
          </h1>

          <p className="text-muted-foreground">
            Manage every building in your portfolio.
          </p>
        </div>

        {propertyAtLimit ? (
          <Button
            variant="hero"
            onClick={() =>
              setUpgradeOpen(
                true
              )
            }
            title={`${planLabel} plan: ${
              limits.maxProperties ===
              Infinity
                ? "∞"
                : limits.maxProperties
            } properties`}
          >
            <Lock className="h-4 w-4" />
            Add property
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
                Add property
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editId
                    ? "Edit property"
                    : "New property"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={
                  submit
                }
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>
                    Name
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
                    Address
                  </Label>

                  <Input
                    required
                    value={
                      form.address
                    }
                    onChange={(
                      e
                    ) =>
                      setForm(
                        {
                          ...form,
                          address:
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
                      Total units
                    </Label>

                    <Input
                      type="number"
                      min="1"
                      required
                      value={
                        form.units
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            units:
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
                      Occupied
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      value={
                        form.occupied
                      }
                      onChange={(
                        e
                      ) =>
                        setForm(
                          {
                            ...form,
                            occupied:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                      disabled={
                        !!editId
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : (editId
                      ? "Save"
                      : "Create")}
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
              ? "Your plan is paused. Reactivate to add more properties."
              : `${planLabel} includes ${
                  limits.maxProperties ===
                  Infinity
                    ? "unlimited"
                    : limits.maxProperties
                } ${
                  limits.maxProperties ===
                  1
                    ? "property"
                    : "properties"
                }. You're at ${propertyCount}.`
          }
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Search properties…"
          value={q}
          onChange={(e) =>
            setQ(
              e.target.value
            )
          }
          className="pl-9"
        />
      </div>

      {filtered.length ===
      0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Home className="h-8 w-8 text-muted-foreground mx-auto mb-3" />

          <div className="font-display font-semibold">
            No properties yet
          </div>

          <div className="text-sm text-muted-foreground">
            Add your first building to get started.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map(
            (p) => {
              const units =
                Number(
                  p?.units ??
                    0
                );

              const occupied =
                Number(
                  p?.occupied ??
                    0
                );

              const vacant =
                Math.max(
                  0,
                  units -
                    occupied
                );

              return (
                <div
                  key={
                    p?.id
                  }
                  className="rounded-xl border border-border bg-gradient-card p-5 hover:border-primary/40 transition-smooth"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Home className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          openEdit(
                            p.id
                          )
                        }
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete{" "}
                              {p?.name ||
                                "property"}
                              ?
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              Tenants assigned to this property will be marked as moved out.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              Cancel
                            </AlertDialogCancel>

                            <AlertDialogAction
                              onClick={() =>
                                remove(
                                  p.id,
                                  p?.name ||
                                    "Property"
                                )
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="mt-4 font-display font-semibold text-lg truncate">
                    {p?.name ||
                      "Unnamed property"}
                  </div>

                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {p?.address ||
                      "No address"}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-muted/40 p-2">
                      <div className="text-muted-foreground">
                        Units
                      </div>

                      <div className="font-semibold text-base">
                        {units}
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/40 p-2">
                      <div className="text-muted-foreground">
                        Occupied
                      </div>

                      <div className="font-semibold text-base">
                        {occupied}
                      </div>
                    </div>

                    <div className="rounded-md bg-muted/40 p-2">
                      <div className="text-muted-foreground">
                        Vacant
                      </div>

                      <div className="font-semibold text-base">
                        {vacant}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
