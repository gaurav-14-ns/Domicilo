import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

interface OrgRow {
  id: string;

  full_name: string | null;

  email: string | null;

  company_name: string | null;

  properties: number;

  tenants: number;
}

export const PlatformOrganizations =
  () => {
    const [
      rows,
      setRows,
    ] = useState<
      OrgRow[]
    >([]);

    const [
      loading,
      setLoading,
    ] = useState(true);

    const mountedRef =
      useRef(true);

    useEffect(() => {
      mountedRef.current = true;
      const load =
        async () => {
          try {
            const {
              data:
                profiles,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(
                  "id, full_name, email"
                );

            const {
              data:
                settings,
            } =
              await supabase
                .from(
                  "app_settings"
                )
                .select(
                  "user_id, company_name"
                );

            const {
              data:
                properties,
            } =
              await supabase
                .from(
                  "properties"
                )
                .select(
                  "id, owner_id"
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
                  "id, owner_id"
                );

            const out =
              (
                profiles ??
                []
              ).map(
                (p) => ({
                  id: p.id,

                  full_name:
                    p.full_name,

                  email:
                    p.email,

                  company_name:
                    settings?.find(
                      (
                        s
                      ) =>
                        s.user_id ===
                        p.id
                    )
                      ?.company_name ??
                    null,

                  properties:
                    properties?.filter(
                      (
                        prop
                      ) =>
                        prop.owner_id ===
                        p.id
                    ).length ??
                    0,

                  tenants:
                    tenants?.filter(
                      (
                        t
                      ) =>
                        t.owner_id ===
                        p.id
                    ).length ??
                    0,
                })
              );

            if (
              mountedRef.current
            ) {
              setRows(out);
            }
          } catch (err) {
            console.error(
              err
            );
          } finally {
            if (
              mountedRef.current
            ) {
              setLoading(
                false
              );
            }
          }
        };

      load();

      return () => {
        mountedRef.current =
          false;
      };
    }, []);

    if (loading) {
      return (
        <div className="text-sm text-muted-foreground">
          Loading organizations...
        </div>
      );
    }

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3">
                Owner
              </th>

              <th className="text-left p-3">
                Company
              </th>

              <th className="text-left p-3">
                Properties
              </th>

              <th className="text-left p-3">
                Tenants
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (r) => (
                <tr
                  key={r.id}
                  className="border-b border-border/50"
                >
                  <td className="p-3">
                    <div className="font-medium">
                      {
                        r.full_name
                      }
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {r.email}
                    </div>
                  </td>

                  <td className="p-3">
                    {r.company_name ||
                      "—"}
                  </td>

                  <td className="p-3">
                    {
                      r.properties
                    }
                  </td>

                  <td className="p-3">
                    {r.tenants}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    );
  };
