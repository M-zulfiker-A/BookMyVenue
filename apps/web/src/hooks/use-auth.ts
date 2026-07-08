import { useEffect, useState } from "react";
import type { AuthSession, AuthUser } from "@repo/contracts";
import { authProvider } from "@/infrastructure/providers";
import { useSession } from "@/lib/auth-client";

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = authProvider.onAuthStateChange((s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    authProvider.getSession().then((s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { session, user, loading };
}

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      return;
    }
    const userRole = user.metadata?.role as string | undefined;
    const computedRoles = ["customer"];
    if (userRole === "host" || user.metadata?.isHost === true) {
      computedRoles.push("host");
    }
    if (userRole === "admin" || user.metadata?.isAdmin === true) {
      computedRoles.push("admin");
    }
    setRoles(computedRoles);
  }, [user]);

  return {
    user,
    roles,
    isHost: roles.includes("host"),
    isAdmin: roles.includes("admin"),
  };
}
