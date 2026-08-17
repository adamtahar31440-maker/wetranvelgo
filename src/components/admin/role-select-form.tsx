"use client";

import { useTransition } from "react";
import { setUserRole } from "@/lib/admin-actions";
import { ROLES, type Role } from "@/lib/roles";

export function RoleSelectForm({ clerkUserId, role }: { clerkUserId: string; role?: Role }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role ?? "user"}
      disabled={isPending}
      onChange={(e) => startTransition(() => setUserRole(clerkUserId, e.target.value as Role))}
      className="rounded-lg border border-black/10 px-2 py-1 text-xs"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
