"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initPostHog, identifyUser, resetUser } from "@/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.userId) {
      // 只追踪 Student 和 Supplier，不追踪 Admin
      const userRole = session.dataType;
      if (userRole === "Student" || userRole === "Supplier") {
        identifyUser(session.userId, {
          email: session.user?.email,
          name: session.user?.name,
          role: userRole,
        });
      } else {
        // Admin 用户重置追踪
        resetUser();
      }
    } else if (status === "unauthenticated") {
      resetUser();
    }
  }, [session, status]);

  return <>{children}</>;
}

