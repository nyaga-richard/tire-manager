import { Suspense } from "react";
import SendForRetreadingPage from "./SendPage";

export default function SendPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Loading send page…</div>}>
      <SendForRetreadingPage />
    </Suspense>
  );
}
