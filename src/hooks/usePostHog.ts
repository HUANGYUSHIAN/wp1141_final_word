"use client";

import { useSession } from "next-auth/react";
import { captureEvent } from "@/lib/posthog";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function usePostHog() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // 追踪页面访问
  useEffect(() => {
    if (session?.userId && session?.dataType) {
      const role = session.dataType;
      // 只追踪 Student 和 Supplier
      if (role === "Student" || role === "Supplier") {
        captureEvent("page_viewed", {
          page: pathname,
          role: role,
        });
      }
    }
  }, [pathname, session]);

  return {
    captureEvent: (eventName: string, properties?: Record<string, any>) => {
      if (session?.dataType === "Student" || session?.dataType === "Supplier") {
        captureEvent(eventName, {
          ...properties,
          role: session.dataType,
        });
      }
    },
  };
}

