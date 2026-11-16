export const dynamic = "force-dynamic";

import React from "react";
import { MaintenanceContainer } from "@/components/maintenance/maintenance-container";
import { RequirePageAccess } from "@/components/require-page-access";

export default function MaintenancePage() {
  return (
    <RequirePageAccess>
      <MaintenanceContainer />
    </RequirePageAccess>
  );
}
