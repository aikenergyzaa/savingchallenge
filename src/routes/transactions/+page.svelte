<script lang="ts">
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import { getSupabaseErrorMessage } from "$lib/supabaseError";
    import { format } from "date-fns";
    import { ChevronRight, Gem } from "lucide-svelte";
    import { currentUser } from "$lib/userStore";
    import { resolveOwner } from "$lib/owner";

    let transactions: any[] = [];
    let loading = true;
    let loadError = "";
    let selectedMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    $: if ($currentUser) {
        loadTransactions();
    }

    async function loadTransactions() {
        loading = true;
        loadError = "";
        const [year, month] = selectedMonth.split("-");
        const startOfMonth = new Date(
            parseInt(year),
            parseInt(month) - 1,
            1,
        ).toISOString();
        const endOfMonth = new Date(
            parseInt(year),
            parseInt(month),
            0,
            23,
            59,
            59,
        ).toISOString();
        const { owner } = await resolveOwner(supabase, $currentUser);
        if (!owner) {
            transactions = [];
            loadError = "ยังไม่พบผู้ใช้ที่ใช้งานอยู่";
            loading = false;
            return;
        }

        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .gte("date", startOfMonth)
            .lte("date", endOfMonth)
            .eq("owner", owner)
            .order("date", { ascending: false });

        if (error) {
            console.error(error);
            transactions = [];
            loadError = getSupabaseErrorMessage("โหลดรายการไม่สำเร็จ", error);
        } else {
            transactions = data || [];
        }

        loading = false;
    }

    onMount(loadTransactions);
</script>

<div class="space-y-6">
    <section class="hero-panel p-6">
        <div class="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <div class="eyebrow text-white/65">Ledger Activity</div>
                <h2 class="mt-2 text-4xl font-extrabold tracking-tight text-white">รายการทั้งหมด</h2>
                <p class="mt-2 text-sm text-white/72">ดูและแก้ไขรายการรายรับรายจ่ายตามเดือน</p>
            </div>
            <div class="w-full md:w-auto">
                <label for="hero-month" class="field-label !text-white/65">เดือน</label>
                <input
                    id="hero-month"
                    type="month"
                    bind:value={selectedMonth}
                    on:change={loadTransactions}
                    class="lux-input mt-2 min-w-[220px] border-white/10 bg-white/10 text-white [color-scheme:dark] placeholder:text-white/50"
                />
            </div>
        </div>
    </section>

    <div class="flex items-center justify-between">
        <h3 class="text-2xl font-bold text-[#171411]">Ledger</h3>
        <input
            type="month"
            bind:value={selectedMonth}
            on:change={loadTransactions}
            class="lux-input hidden md:block w-auto px-4 py-2 text-sm"
        />
    </div>

    {#if loading}
        <div class="section-card py-10 text-center text-[#6f665c]">กำลังโหลด...</div>
    {:else if loadError}
        <div class="section-card border border-rose-100 py-10 text-center">
            <p class="text-rose-600 whitespace-pre-line">{loadError}</p>
        </div>
    {:else if transactions.length === 0}
        <div class="section-card py-10 text-center">
            <p class="text-[#6f665c]">ไม่พบรายการในเดือนนี้</p>
        </div>
    {:else}
        <div class="section-card overflow-hidden">
            {#each transactions as tx}
                <a
                    href="/transactions/{tx.id}"
                    class="block border-b border-[#00000008] transition-colors hover:bg-[#faf6ef] last:border-0"
                >
                    <div class="flex items-center justify-between gap-4 p-4 md:p-5">
                        <div class="flex items-center gap-4">
                            <div
                                class="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold {tx.type ===
                                'income'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-[#fbf0ec] text-rose-700'}"
                            >
                                {tx.type === "income" ? "+" : "-"}
                            </div>
                            <div>
                                <div class="flex items-center gap-2 font-medium text-[#171411]">
                                    {tx.category}
                                    {#if tx.category.toLowerCase().includes("luxury") || tx.category.includes("ฟุ่มเฟือย")}
                                        <span
                                            class="flex items-center gap-1 rounded-full bg-[#f5efdf] px-2 py-0.5 text-xs text-[#8c6a22]"
                                        >
                                            <Gem size={10} /> Luxury
                                        </span>
                                    {/if}
                                </div>
                                <div class="text-xs text-[#6f665c]">
                                    {format(new Date(tx.date), "dd MMM yyyy")}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="font-bold {tx.type === 'income'
                                    ? 'text-emerald-700'
                                    : 'text-[#171411]'}"
                            >
                                {tx.type === "income"
                                    ? "+"
                                    : "-"}฿{tx.amount.toLocaleString()}
                            </span>
                            <ChevronRight size={16} class="text-[#b8ac99]" />
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>
