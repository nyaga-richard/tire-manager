import { Suspense } from "react";
import CreateRetreadBatchPage from "./CreatePage";

export default function CreateBatchPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading create batch page…</div>}>
      <CreateRetreadBatchPage />
    </Suspense>
  );
}
