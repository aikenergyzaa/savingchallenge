<script lang="ts">
    export let data: {
        next: string;
    };

    export let form:
        | {
              error?: string;
              next?: string;
          }
        | undefined;
</script>

<div class="min-h-[70vh] flex items-center justify-center">
    <div class="glass-panel w-full max-w-md p-8">
        <div class="eyebrow mb-2">Private Access</div>
        <h1 class="text-3xl font-bold text-[#171411]">ใส่รหัสก่อนเข้าใช้งาน</h1>
        <p class="mt-2 text-sm text-[#6f665c]">
            ระบบถูกล็อกด้วยรหัสตัวเลขเพื่อจำกัดการเข้าถึง
        </p>

        <form method="POST" class="mt-5 space-y-4">
            <input type="hidden" name="next" value={form?.next || data.next || "/"} />

            <div class="field-shell">
                <label for="passcode" class="field-label"
                    >รหัสตัวเลข</label
                >
                <input
                    id="passcode"
                    name="passcode"
                    type="password"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="current-password"
                    required
                    class="lux-input text-center text-lg tracking-[0.5em]"
                    placeholder="••••••"
                />
            </div>

            {#if form?.error}
                <p class="rounded-[18px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {form.error}
                </p>
            {/if}

            <button
                type="submit"
                class="lux-button-primary w-full"
            >
                เข้าสู่ระบบ
            </button>
        </form>
    </div>
</div>
