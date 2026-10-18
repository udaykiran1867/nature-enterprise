import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-24">
      <Loader2 className="size-7 animate-spin text-forest" aria-label="Loading..." />
    </div>
  );
}

