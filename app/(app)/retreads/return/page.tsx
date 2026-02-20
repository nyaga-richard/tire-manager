import { Suspense } from "react";
import ReturnFromRetreadingPage from "./ReturnPage";

export default function ReturnPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading return page…</div>}>
      <ReturnFromRetreadingPage />
    </Suspense>
  );
}
