import { Suspense } from "react";
import FinanceIntakeClient from "./FinanceIntakeClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <FinanceIntakeClient />
    </Suspense>
  );
}
