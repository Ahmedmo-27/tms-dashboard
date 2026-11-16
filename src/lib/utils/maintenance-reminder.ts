/**
 * Space Maintenance Reminder Utilities
 * Manages sound synthesis and hourly alert milestones for branch admins.
 */

export function playReminderSound(urgent: boolean = false) {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";

    if (urgent) {
      // Urgent dual-tone chime (higher pitch)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else {
      // Pleasant reminder chime
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Audio might be suppressed by browser autoplay policy before first user gesture
  }
}

export type ReminderMilestone = "15m" | "30m" | "45m" | "55m";

/**
 * Given current minute of the hour (0-59), returns if we are in a milestone window:
 * - 15m passed (15-29m) -> gentle reminder
 * - 30m passed (30-44m) -> half-hour reminder
 * - 45m passed (45-54m) -> urgent 15m remaining
 * - 55m passed (55-59m) -> critical 5m remaining
 */
export function getCurrentMilestone(minute: number): ReminderMilestone | null {
  if (minute >= 55) return "55m";
  if (minute >= 45) return "45m";
  if (minute >= 30) return "30m";
  if (minute >= 15) return "15m";
  return null;
}
