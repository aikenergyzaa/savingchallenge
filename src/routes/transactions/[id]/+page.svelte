<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import { format } from "date-fns";
    import { ArrowLeft, Gem, Trash2, Pencil } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { getJarAllocations, type JarAllocation } from "$lib/jars";
    import { currentUser } from "$lib/userStore";
    import { resolveOwner } from "$lib/owner";
    import { getReceiptPreviewUrl } from "$lib/receiptUrl";

    const { id } = $page.params;
    let transaction: any = null;
    let loading = true;
    let imageUrl: string | null = null;
    let incomeAllocations: JarAllocation[] = [];

    $: incomeAllocations =
        transaction?.type === "income"
            ? getJarAllocations(Number(transaction.amount) || 0)
            : [];

    async function handleDelete() {
        if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการนี้?")) return;
        const { owner } = await resolveOwner(supabase, $currentUser);
        if (!owner) {
            alert("ไม่สามารถระบุเจ้าของข้อมูลได้ กรุณาเข้าสู่ระบบใหม่");
            return;
        }

        const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id)
            .eq("owner", owner);

        if (error) {
            console.error("Error deleting transaction:", error);
            alert("Failed to delete transaction");
        } else {
            goto("/transactions");
        }
    }

    onMount(async () => {
        const { owner } = await resolveOwner(supabase, $currentUser);
        if (!owner) {
            loading = false;
            return;
        }

        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", id)
            .eq("owner", owner)
            .single();

        if (error) {
            console.error(error);
        } else {
            transaction = data;
            if (transaction.image_path) {
                imageUrl = await getReceiptPreviewUrl(transaction.image_path);
            }
        }
        loading = false;
    });
</script>

<div class="space-y-6">
    <a
        href="/transactions"
        class="inline-flex items-center gap-2 text-[#6f665c] transition-colors hover:text-[#171411]"
    >
        <ArrowLeft size={20} />
        กลับไปหน้ารายการ
    </a>

    <div class="flex gap-2">
        <a
            href="/add?id={transaction?.id}"
            class="lux-button-secondary px-4 py-2 text-sm"
        >
            <Pencil size={16} />
            แก้ไข
        </a>
        <button
            on:click={handleDelete}
            class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
        >
            <Trash2 size={16} />
            ลบ
        </button>
    </div>

    {#if loading}
        <div class="section-card py-10 text-center text-[#6f665c]">กำลังโหลด...</div>
    {:else if transaction}
        <div class="glass-panel overflow-hidden">
            <div class="border-b border-[#00000010] p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span
                            class="mb-2 inline-block rounded-full px-3 py-1 text-xs font-medium {transaction.type ===
                            'income'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-[#fbf0ec] text-rose-700'}"
                        >
                            {transaction.type === "income"
                                ? "รายรับ"
                                : "รายจ่าย"}
                        </span>
                        <h1 class="text-3xl font-bold text-[#171411]">
                            {transaction.category}
                        </h1>
                        {#if transaction.category.toLowerCase().includes("luxury") || transaction.category.includes("ฟุ่มเฟือย")}
                            <span
                                class="mt-1 inline-flex items-center gap-1 text-sm text-[#8c6a22]"
                            >
                                <Gem size={14} /> รายจ่ายฟุ่มเฟือย
                            </span>
                        {/if}
                    </div>
                    <div
                        class="text-2xl font-bold {transaction.type === 'income'
                            ? 'text-emerald-700'
                            : 'text-[#171411]'}"
                    >
                        {transaction.type === "income"
                            ? "+"
                            : "-"}฿{transaction.amount.toLocaleString()}
                    </div>
                </div>

                <div class="text-sm text-[#6f665c]">
                    วันที่: {format(new Date(transaction.date), "dd MMMM yyyy")}
                </div>

                {#if transaction.note}
                    <div
                        class="mt-4 rounded-[20px] bg-white/70 p-4 text-sm text-[#171411]"
                    >
                        {transaction.note}
                    </div>
                {/if}

                {#if incomeAllocations.length > 0}
                    <div class="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
                        <div class="mb-2 font-bold text-emerald-800">
                            Auto-Allocation (40/20/20/20)
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            {#each incomeAllocations as jar}
                                <div
                                    class="rounded-[18px] border border-emerald-100 bg-white p-3"
                                >
                                    <div class="text-[11px] text-slate-500">
                                        {jar.label} ({Math.round(
                                            jar.percent * 100,
                                        )}%)
                                    </div>
                                    <div class="font-bold text-sm text-slate-800">
                                        ฿{jar.amount.toLocaleString()}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            {#if imageUrl}
                <div class="p-6">
                    <h3 class="mb-3 text-sm font-medium text-[#171411]">
                        รูปใบเสร็จ / สลิป
                    </h3>
                    <img
                        src={imageUrl}
                        alt="Receipt"
                        class="w-full rounded-[24px] border border-[#00000010]"
                    />
                </div>
            {/if}
        </div>
    {:else}
        <div class="section-card py-10 text-center text-[#6f665c]">ไม่พบข้อมูล</div>
    {/if}
</div>
