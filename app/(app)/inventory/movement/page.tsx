import { Suspense } from "react";
import MovementHistoryClient from "./MovementHistoryClient";

export default function MovementHistoryPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading movement history…</div>}>
      <MovementHistoryClient />
    </Suspense>
  );
}
