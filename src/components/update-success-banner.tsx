"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export function UpdateSuccessBanner({ message }: { message: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace(pathname, { scroll: false });
    }, 5000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
      <CheckCircle2 size={18} className="shrink-0" />
      {message}
    </div>
  );
}
