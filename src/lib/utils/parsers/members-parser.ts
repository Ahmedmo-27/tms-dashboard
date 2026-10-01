import { Member, AdjustmentRecord } from "@/components/ui/members/columns";

const toDayKey = (val: any): string => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

export const parseMembers = (members: any): Member[] => {
  if (!Array.isArray(members)) return [];
  const parsedMembers: Member[] = [];
  members.forEach((member: any) => {
    if (!member || !member.uid) return;

    const parsedPackages: any = [];
    const allDeductions: AdjustmentRecord[] = [];
    const seenMemberAttendance = new Set<string>();
    const parsedPtAttendance: any = [];

    const pushMemberAttendance = (packageLabel: string, attendanceTime: any) => {
      if (!attendanceTime) return;
      const d = new Date(attendanceTime);
      if (isNaN(d.getTime())) return;
      const dayKey = toDayKey(d);
      const label = (packageLabel || "Attendance").trim();
      const key = `${dayKey}:${label.toLowerCase()}`;
      if (seenMemberAttendance.has(key)) return;
      seenMemberAttendance.add(key);
      parsedPtAttendance.push({
        attendanceTime: d.toISOString(),
        package: label,
      });
    };

    (member.packages || []).forEach((pkg: any) => {
      if (!pkg) return;

      const pkgIdStr =
        pkg.pkgId?._id?.toString() ??
        pkg.pkgId?.toString() ??
        pkg._id?.toString() ??
        "ERROR";

      const pkgName =
        pkg.pkgId?.name ??
        pkg.name ??
        (pkg.pkgId ? "Package" : "Archived Package");

      const rawAdjustments: any[] = Array.isArray(pkg.adjustmentHistory)
        ? [...pkg.adjustmentHistory]
        : [];

      const ptForPackage = (member.ptAttendance ?? []).filter((rec: any) => {
        if (!rec) return false;
        const recPkgId =
          rec.pkgId?._id?.toString() ?? rec.pkgId?.toString();
        return recPkgId === pkgIdStr;
      });

      // Ensure every PT attendance record for this package also appears in adjustmentHistory
      ptForPackage.forEach((rec: any) => {
        const attTime = rec.attendanceTime ?? rec.date;
        const dayKey = toDayKey(attTime);
        if (!dayKey) return;
        const alreadyInAdjustments = rawAdjustments.some((adj: any) => {
          if (!adj || adj.type !== "DEDUCT") return false;
          const adjDay = toDayKey(adj.attendanceDate ?? adj.date);
          return (
            adjDay === dayKey &&
            (adj.source === "PT_ATTENDANCE" ||
              adj.source === "COACH" ||
              adj.source === "ADMIN" ||
              adj.source === "ATTENDANCE")
          );
        });
        if (!alreadyInAdjustments) {
          rawAdjustments.push({
            date: attTime,
            attendanceDate: attTime,
            className: rec.className ?? rec.pkgId?.name ?? pkgName,
            amount: 1,
            type: "DEDUCT",
            source: "PT_ATTENDANCE",
            reason: `PT attendance: ${rec.className ?? rec.pkgId?.name ?? pkgName}`,
          });
        }
      });

      const adjustmentHistory: AdjustmentRecord[] = rawAdjustments
        .filter(Boolean)
        .map((adj: any) => ({
          date: adj.date ?? adj.attendanceDate ?? new Date().toISOString(),
          attendanceDate: adj.attendanceDate,
          className: adj.className,
          packageName: pkgName,
          pkgId: pkgIdStr,
          amount: typeof adj.amount === "number" ? adj.amount : Number(adj.amount) || 0,
          type: (adj.type === "ADD" ? "ADD" : "DEDUCT") as "ADD" | "DEDUCT",
          source: adj.source ?? "ADMIN",
          reason: adj.reason ?? adj.className ?? pkgName,
        }))
        .sort(
          (a, b) =>
            new Date(b.attendanceDate ?? b.date).getTime() -
            new Date(a.attendanceDate ?? a.date).getTime()
        );

      allDeductions.push(...adjustmentHistory);

      // Build package attendance list from backend pkg.attendance, ptAttendance, and attendance-based deductions
      const seenPkgAtt = new Set<string>();
      const bundledAttendance: { className: string; attendanceDate: string }[] = [];

      const addPkgAttendance = (className: string, attendanceDate: any) => {
        if (!attendanceDate) return;
        const d = new Date(attendanceDate);
        if (isNaN(d.getTime())) return;
        const dayKey = toDayKey(d);
        const label = (className || pkgName).trim();
        const key = `${dayKey}:${label.toLowerCase()}`;
        if (seenPkgAtt.has(key)) return;
        seenPkgAtt.add(key);
        bundledAttendance.push({
          className: label,
          attendanceDate: d.toISOString(),
        });
      };

      (pkg.attendance ?? []).forEach((rec: any) => {
        if (!rec) return;
        addPkgAttendance(
          rec.className ?? pkgName,
          rec.attendanceDate ?? rec.attendanceTime ?? rec.date
        );
      });

      ptForPackage.forEach((rec: any) => {
        addPkgAttendance(
          rec.className ?? rec.pkgId?.name ?? pkgName,
          rec.attendanceTime ?? rec.date
        );
      });

      adjustmentHistory.forEach((adj) => {
        if (adj.type !== "DEDUCT") return;
        const reasonLower = (adj.reason || "").trim().toLowerCase();
        const isAttendanceSource =
          adj.source === "PT_ATTENDANCE" ||
          adj.source === "ATTENDANCE" ||
          adj.source === "SPACE_WALK" ||
          adj.source === "BOOKING" ||
          ((adj.source === "COACH" || adj.source === "ADMIN") &&
            (reasonLower.startsWith("completed session") ||
              reasonLower.startsWith("makeup") ||
              reasonLower.startsWith("attended")));
        if (isAttendanceSource) {
          addPkgAttendance(
            adj.className || adj.reason || pkgName,
            adj.attendanceDate ?? adj.date
          );
        }
      });

      bundledAttendance.sort(
        (a, b) =>
          new Date(b.attendanceDate).getTime() -
          new Date(a.attendanceDate).getTime()
      );

      bundledAttendance.forEach((att) => {
        const displayLabel =
          att.className && att.className !== pkgName
            ? `${att.className} — ${pkgName}`
            : pkgName;
        pushMemberAttendance(displayLabel, att.attendanceDate);
      });

      const rawStatus = (pkg.status ?? "").toUpperCase();
      const isFrozen = rawStatus === "FROZEN" || Boolean(pkg.freezeInfo?.isFrozen);
      const pkgEndDateStr = pkg.pkgEndDate ?? "";
      const pkgStartDateStr = pkg.pkgStartDate ?? "";
      const remainingClasses =
        typeof pkg.remainingClasses === "number"
          ? pkg.remainingClasses
          : (Number(pkg.remainingClasses) || 0);

      const isSpaceEligible =
        pkgName &&
        /spacer\s*mix|open\s*gym|ultimate\s*mindspacer|space\s*membership/i.test(pkgName);

      let effectiveStatus = rawStatus;
      if (rawStatus !== "DELETED") {
        if (isFrozen) {
          effectiveStatus = "FROZEN";
        } else if (
          pkgEndDateStr &&
          !isNaN(new Date(pkgEndDateStr).getTime()) &&
          new Date(pkgEndDateStr) < new Date()
        ) {
          effectiveStatus = "EXPIRED";
        } else if (
          remainingClasses <= 0 &&
          pkg.remainingClasses !== undefined &&
          pkg.remainingClasses !== "" &&
          !isSpaceEligible
        ) {
          effectiveStatus = "COMPLETED";
        } else if (!rawStatus || rawStatus === "ACTIVE") {
          effectiveStatus = "ACTIVE";
        }
      }

      const parsedPackage = {
        _id: pkgIdStr,
        name: pkgName,
        pkgStartDate: pkgStartDateStr,
        pkgEndDate: pkgEndDateStr,
        remainingClasses: remainingClasses,
        status: effectiveStatus,
        adjustmentHistory,
        attendance: bundledAttendance,
        freezeInfo: pkg.freezeInfo,
      };
      parsedPackages.push(parsedPackage);
    });

    const parsedBookings: any = [];
    (member.bookings || []).forEach((booking: any) => {
      if (!booking || !booking.scid || !booking.scid.cid) {
        parsedBookings.push({
          scid: "ERROR",
          className: "ERROR - Contact support",
          bookingTime: "",
          classTime: "",
        });
        return;
      }
      const parsedBooking = {
        scid: booking.scid._id?.toString() ?? String(booking.scid._id),
        className: booking.scid.cid.title ?? "Class",
        bookingTime: booking.bookingTime,
        classTime: booking.scid.startTime,
      };
      parsedBookings.push(parsedBooking);
    });

    (member.ptAttendance || []).forEach((record: any) => {
      if (!record) return;
      pushMemberAttendance(
        record.pkgId?.name ?? record.packageName ?? record.className ?? "PT Attendance",
        record.attendanceTime ?? record.date
      );
    });

    (member.attendance || []).forEach((att: any) => {
      const sc = att?.scid;
      if (!sc || typeof sc !== "object") return;
      const title = sc.cid?.title ?? sc.className ?? "Scheduled Class";
      pushMemberAttendance(title, sc.startTime);
    });

    parsedPtAttendance.sort(
      (a: any, b: any) =>
        new Date(b.attendanceTime).getTime() -
        new Date(a.attendanceTime).getTime()
    );

    allDeductions.sort(
      (a, b) =>
        new Date(b.attendanceDate ?? b.date).getTime() -
        new Date(a.attendanceDate ?? a.date).getTime()
    );

    const parsedMember: Member = {
      id: member.uid._id?.toString() ?? String(member.uid._id ?? ""),
      name: member.uid.name ?? "Unknown",
      phone: member.uid.phoneNumber ?? "",
      email: member.uid.email ?? "",
      packages: parsedPackages,
      bookings: parsedBookings,
      activePkgs: parsedPackages.filter(
        (p: any) =>
          p.status?.toUpperCase() === "ACTIVE" &&
          (!p.pkgEndDate || new Date(p.pkgEndDate) >= new Date())
      ).length,
      ptAttendance: parsedPtAttendance,
      deductions: allDeductions,
    };
    parsedMembers.push(parsedMember);
  });
  return parsedMembers;
};
