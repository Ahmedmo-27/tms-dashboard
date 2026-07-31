"use client";

import { OpenGymBranchSelect } from "@/components/ui/open-gym/branch-select";

interface ManagementBranchFieldProps {
  locationId: string;
  onLocationChange: (locationId: string) => void;
  needsBranchSelection: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * Renders a branch picker for management when no page-level branch is selected;
 * otherwise submits locationId as a hidden field.
 */
export function ManagementBranchField({
  locationId,
  onLocationChange,
  needsBranchSelection,
  disabled,
  label = "Branch",
}: ManagementBranchFieldProps) {
  if (!needsBranchSelection) {
    return <input type="hidden" name="locationId" value={locationId} />;
  }

  return (
    <>
      <OpenGymBranchSelect
        value={locationId}
        onChange={onLocationChange}
        disabled={disabled}
        label={label}
      />
      <input type="hidden" name="locationId" value={locationId} />
    </>
  );
}
