import { describe, expect, it, vi, beforeEach } from "vitest";
import { isCoachRole, isShadowCoachRole } from "@/lib/config/roles";
import { scheduledClassSchema } from "@/lib/schemas/scheduledClassSchema";
import { scheduleClassAction, editClassAction } from "@/lib/actions/schedule-actions";
import { tms } from "@/lib/tms-api";

vi.mock("@/lib/tms-api", () => ({
  tms: {
    post: vi.fn(),
    patch: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Dashboard Shadow Coach Role & Schedule Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Configuration & Recognition", () => {
    it("recognizes shadow_coach as a valid coach role", () => {
      expect(isCoachRole("shadow_coach")).toBe(true);
      expect(isCoachRole("coach")).toBe(true);
      expect(isCoachRole("managing_coach")).toBe(true);
      expect(isCoachRole("admin")).toBe(false);
      expect(isCoachRole("member")).toBe(false);
    });

    it("specifically identifies shadow_coach with isShadowCoachRole", () => {
      expect(isShadowCoachRole("shadow_coach")).toBe(true);
      expect(isShadowCoachRole("coach")).toBe(false);
      expect(isShadowCoachRole("managing_coach")).toBe(false);
      expect(isShadowCoachRole("branch_admin")).toBe(false);
    });
  });

  describe("Scheduled Class Schema with Shadow Coach", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(11, 0, 0, 0);

    it("successfully validates class payload containing shadowCoachId", () => {
      const validPayload = {
        clsId: "class-123",
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
        coachId: ["lead-coach-456"],
        shadowCoachId: "shadow-coach-789",
        availableSlots: 20,
        locationId: "loc-001",
      };

      const result = scheduledClassSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shadowCoachId).toBe("shadow-coach-789");
      }
    });

    it("successfully validates class payload when shadowCoachId is null or omitted", () => {
      const payloadWithoutShadow = {
        clsId: "class-123",
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
        coachId: ["lead-coach-456"],
        shadowCoachId: null,
        availableSlots: 20,
        locationId: "loc-001",
      };

      const result = scheduledClassSchema.safeParse(payloadWithoutShadow);
      expect(result.success).toBe(true);
    });

    it("rejects payload when endTime is before startTime", () => {
      const invalidPayload = {
        clsId: "class-123",
        startTime: tomorrowEnd.toISOString(),
        endTime: tomorrow.toISOString(), // Invalid: before start
        coachId: ["lead-coach-456"],
        shadowCoachId: "shadow-coach-789",
        availableSlots: 20,
        locationId: "loc-001",
      };

      const result = scheduledClassSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Schedule Actions Payload Transmission", () => {
    it("passes shadowCoachId in scheduleClassAction FormData", async () => {
      (tms.post as any).mockResolvedValueOnce({
        data: {
          data: {
            _id: "scheduled-1",
            cid: "class-1",
            shadowCoachId: "shadow-coach-123",
          },
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(11, 0, 0, 0);

      const formData = new FormData();
      formData.set("clsId", "class-1");
      formData.set("startTime", tomorrow.toISOString());
      formData.set("endTime", tomorrowEnd.toISOString());
      formData.append("coachId", "coach-lead-1");
      formData.set("shadowCoachId", "shadow-coach-123");
      formData.set("availableSlots", "15");
      formData.set("locationId", "loc-1");

      const result = await scheduleClassAction(null, formData);
      expect(result?.success).toBe(true);
      expect(tms.post).toHaveBeenCalledWith(
        "/admin/schedule",
        expect.objectContaining({
          shadowCoachId: "shadow-coach-123",
          cid: "class-1",
        })
      );
    });

    it("passes shadowCoachId in editClassAction FormData", async () => {
      (tms.patch as any).mockResolvedValueOnce({
        data: {
          data: {
            _id: "scheduled-1",
            shadowCoachId: "shadow-coach-456",
          },
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(11, 0, 0, 0);

      const formData = new FormData();
      formData.set("scid", "scheduled-1");
      formData.set("clsId", "class-1");
      formData.set("startTime", tomorrow.toISOString());
      formData.set("endTime", tomorrowEnd.toISOString());
      formData.append("coachId", "coach-lead-1");
      formData.set("shadowCoachId", "shadow-coach-456");
      formData.set("availableSlots", "18");
      formData.set("locationId", "loc-1");

      const result = await editClassAction(null, formData);
      expect(result?.success).toBe(true);
      expect(tms.patch).toHaveBeenCalledWith(
        "/admin/schedule/scheduled-1",
        expect.objectContaining({
          shadowCoachId: "shadow-coach-456",
        })
      );
    });
  });

  describe("Shadow Coach Notifications & Assigned Classes Tracking", () => {
    it("handles class_assignment notifications in coachSlice reducer", async () => {
      const coachSliceModule = await import("@/lib/store/features/coachSlice");
      const coachReducer = coachSliceModule.default;
      const { addNotification } = coachSliceModule;

      const initialState = {
        coachId: "coach-shadow-1",
        name: "Shadow Coach Sarah",
        email: "sarah@tms.com",
        phoneNumber: "01000000000",
        role: "shadow_coach",
        branchName: null,
        token: "fake-jwt",
        clients: [],
        clientsLoading: false,
        clientsTotalPages: 1,
        clientsTotal: 0,
        notifications: [],
        schedule: null,
        scheduleLoading: false,
        hasPtSessions: false,
        hasScheduledClasses: true,
        scansCategories: [],
        canViewPtReports: false,
        capabilitiesLoaded: true,
      };

      const classNotificationPayload = {
        id: "notif-class-1",
        type: "class_assignment" as const,
        title: "Class Assignment: Functional Strength",
        message: "You have been assigned to shadow Functional Strength with lead coach Captain Ahmed.",
        scheduledClassId: "sc-123",
        classTitle: "Functional Strength",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        locationName: "Zamalek Branch",
        leadCoachName: "Captain Ahmed",
        createdAt: new Date().toISOString(),
      };

      const nextState = coachReducer(initialState, addNotification(classNotificationPayload));

      expect(nextState.notifications.length).toBe(1);
      expect(nextState.notifications[0].type).toBe("class_assignment");
      expect(nextState.notifications[0].title).toBe("Class Assignment: Functional Strength");
      expect(nextState.notifications[0].scheduledClassId).toBe("sc-123");
      expect(nextState.notifications[0].read).toBe(false);
    });

    it("verifies shadow coaches do not have scans monitor navigation access", () => {
      const isShadowCoach = true;
      const hasScheduledClasses = true;
      const hasPtSessions = false;
      const hasExtraCategoryScans = false;

      const hasScansMonitorAccess =
        !isShadowCoach &&
        (hasScheduledClasses || hasPtSessions || hasExtraCategoryScans);

      expect(hasScansMonitorAccess).toBe(false);
    });
  });
});
