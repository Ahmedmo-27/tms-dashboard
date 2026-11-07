export type OwedSessionLike = {
  _id: string;
  coachId?: unknown;
  coachName?: string;
  amount?: number;
  attendanceDate?: string;
  clientName?: string;
  phoneNumber?: string;
};

export type OwedSessionCoachGroup<T extends OwedSessionLike> = {
  coachKey: string;
  coachId?: string;
  coachName: string;
  sessions: T[];
};

function extractCoachId(coach: unknown): string | undefined {
  if (!coach) return undefined;
  if (typeof coach === "string") {
    const trimmed = coach.trim();
    return trimmed || undefined;
  }
  if (typeof coach === "object") {
    const asRecord = coach as { _id?: unknown; id?: unknown; coachName?: unknown; name?: unknown };
    if (asRecord._id) return String(asRecord._id).trim() || undefined;
    if (asRecord.id) return String(asRecord.id).trim() || undefined;
  }
  const fallback = String(coach).trim();
  return fallback || undefined;
}

export function getOwedSessionCoachName(session: OwedSessionLike): string {
  if (typeof session.coachId === "object" && session.coachId) {
    const coach = session.coachId as { coachName?: string; name?: string };
    return coach.coachName || coach.name || session.coachName || "PT";
  }
  return session.coachName || "PT";
}

export function groupOwedSessionsByCoach<T extends OwedSessionLike>(
  sessions: T[]
): OwedSessionCoachGroup<T>[] {
  const groups = new Map<string, OwedSessionCoachGroup<T>>();

  for (const session of sessions) {
    const coachName = getOwedSessionCoachName(session);
    const coachId = extractCoachId(session.coachId);
    const coachKey = coachId || coachName;
    const existing = groups.get(coachKey);
    if (existing) {
      existing.sessions.push(session);
      continue;
    }
    groups.set(coachKey, {
      coachKey,
      coachId,
      coachName,
      sessions: [session],
    });
  }

  return Array.from(groups.values());
}
