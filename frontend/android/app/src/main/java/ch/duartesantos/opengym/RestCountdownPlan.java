package ch.duartesantos.opengym;

/**
 * The battery side of the rest countdown, kept free of Android classes so it is unit tested.
 *
 * The clock in the countdown card is a Chronometer that the system draws itself, so the card is
 * reposted only for the bar, and only while someone can see it (screen on). With the screen off
 * nothing is reposted, and turning the screen on brings the card up to date at once.
 *
 * The end is sounded by an exact alarm where Android allows one: that alarm wakes the phone,
 * also in Doze, and RestAlert.fire holds the CPU for the few seconds of the alert. The countdown
 * then holds no wake lock during the rest. Without the exact-alarm permission the alarm may come
 * most of a rest late, so the countdown keeps the CPU awake to sound the end on time, as before.
 */
final class RestCountdownPlan {
    /** Held past the end so the alert can take over before this lock runs out. */
    static final long END_GRACE_MS = 10_000;

    private RestCountdownPlan() {}

    /** How long the countdown holds the CPU for a rest with `leftMs` to go; 0 = no lock at all. */
    static long cpuHoldMs(boolean exactAlarm, long leftMs) {
        if (exactAlarm) return 0;
        return Math.max(0, leftMs) + END_GRACE_MS;
    }

    /**
     * Delay to the next run of the countdown loop. With the screen on, the next whole second so
     * the bar moves with the clock and the last run lands on the end itself. With the screen off
     * nothing is drawn, so the loop only wakes for the end.
     */
    static long nextTickMs(long leftMs, boolean interactive) {
        if (leftMs <= 0) return 0;
        if (!interactive) return leftMs;
        return ((leftMs - 1) % 1000) + 1;
    }

    /**
     * Whether the countdown also goes to the Glyph LEDs: Nothing OS 4 (Android 16, API 36) draws
     * the Glyph Progress strip from a Live Update notification's progress, so on a Nothing phone
     * with API 36 the card is a Live Update (RestAlert.liveUpdateNotification). Elsewhere the
     * custom card stays.
     */
    static boolean glyphProgress(int sdk, String manufacturer) {
        return sdk >= 36 && manufacturer != null && manufacturer.trim().equalsIgnoreCase("nothing");
    }

    /**
     * Same as the two-argument form, for a countdown that feeds the Glyph strip: the strip only
     * moves when the notification is reposted, so the loop runs every second with the screen
     * off as well.
     */
    static long nextTickMs(long leftMs, boolean interactive, boolean glyph) {
        return nextTickMs(leftMs, interactive || glyph);
    }

    /** The progress a Live Update shows for `leftMs` of `totalMs`: full at the start, 0 at the end. */
    static int liveProgress(long leftMs, long totalMs, int max) {
        if (totalMs <= 0 || max <= 0) return 0;
        long left = Math.min(Math.max(0, leftMs), totalMs);
        return (int) Math.round((double) left / totalMs * max);
    }

    /**
     * Chronometer base (elapsed-realtime clock) for a countdown with `leftMs` to go. The
     * Chronometer shows whole seconds rounded down; +999 makes it round up like the in-app clock
     * (and RestAlert.clock), so 1:30 is shown for the whole first second of a 90 s rest and
     * 0:00 at the end.
     */
    static long chronometerBase(long elapsedNow, long leftMs) {
        return elapsedNow + Math.max(0, leftMs) + 999;
    }

    /** Seconds a Chronometer counting down to `base` shows at `elapsedNow` (its own rounding). */
    static long chronometerShows(long base, long elapsedNow) {
        return (base - elapsedNow) / 1000;
    }

    /** The in-app clock's seconds for `leftMs` (round up), what the card used to print. */
    static long clockSeconds(long leftMs) {
        return (Math.max(0, leftMs) + 999) / 1000;
    }
}
