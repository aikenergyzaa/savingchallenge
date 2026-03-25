const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

type ErrorLike = {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
    cause?: unknown;
};

function asNonEmptyString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getConfiguredSupabaseHost(): string | null {
    const rawUrl = asNonEmptyString(supabaseUrl);
    if (!rawUrl) return null;

    try {
        return new URL(rawUrl).host || null;
    } catch {
        return null;
    }
}

function collectErrorText(error: unknown): string {
    if (!error) return "";
    if (typeof error === "string") return error;

    if (error instanceof Error) {
        const parts = [error.message];
        const causeMessage =
            typeof error.cause === "object" &&
            error.cause &&
            "message" in error.cause &&
            typeof (error.cause as { message?: unknown }).message === "string"
                ? String((error.cause as { message?: unknown }).message)
                : null;
        if (causeMessage) parts.push(causeMessage);
        return parts.filter(Boolean).join("\n");
    }

    if (typeof error === "object") {
        const candidate = error as ErrorLike;
        return [
            asNonEmptyString(candidate.message),
            asNonEmptyString(candidate.details),
            asNonEmptyString(candidate.hint),
            asNonEmptyString(candidate.code),
        ]
            .filter(Boolean)
            .join("\n");
    }

    return "";
}

function isSupabaseUrlMisconfigured(): boolean {
    const rawUrl = asNonEmptyString(supabaseUrl);
    if (!rawUrl) return true;

    try {
        const parsed = new URL(rawUrl);
        return !parsed.protocol.startsWith("http") || !parsed.host;
    } catch {
        return true;
    }
}

export function getSupabaseReachabilityMessage(error: unknown): string | null {
    if (isSupabaseUrlMisconfigured()) {
        return "ตรวจสอบค่า VITE_SUPABASE_URL ในไฟล์ .env เพราะตอนนี้ URL ของ Supabase ไม่ถูกต้องหรือยังไม่ได้ตั้งค่า";
    }

    const details = collectErrorText(error).toLowerCase();
    const host = getConfiguredSupabaseHost();

    const looksLikeNetworkFailure =
        details.includes("failed to fetch") ||
        details.includes("fetch failed") ||
        details.includes("networkerror") ||
        details.includes("enotfound") ||
        details.includes("getaddrinfo") ||
        details.includes("dns");

    if (!looksLikeNetworkFailure) return null;

    if (host) {
        return `เชื่อมต่อ Supabase ไม่ได้ (${host}) ตรวจสอบว่า VITE_SUPABASE_URL ถูกต้อง, อินเทอร์เน็ตใช้งานได้, และโปรเจกต์ Supabase นี้ยังมีอยู่`;
    }

    return "เชื่อมต่อ Supabase ไม่ได้ ตรวจสอบค่า VITE_SUPABASE_URL และการเชื่อมต่อเครือข่าย";
}

export function getSupabaseErrorMessage(
    fallbackMessage: string,
    error: unknown,
): string {
    const reachabilityMessage = getSupabaseReachabilityMessage(error);
    if (reachabilityMessage) {
        return `${fallbackMessage}\n${reachabilityMessage}`;
    }

    const details = collectErrorText(error);
    if (details) {
        return `${fallbackMessage}: ${details}`;
    }

    return fallbackMessage;
}
