<script lang="ts">
    import { onMount } from "svelte";
    import BmwE36Splash from "$lib/components/BmwE36Splash.svelte";
    import { introOverlayState } from "$lib/introOverlay";
    import { supabase } from "$lib/supabaseClient";
    import { getSupabaseErrorMessage } from "$lib/supabaseError";
    import { Wallet, TrendingUp, TrendingDown } from "lucide-svelte";
    import { currentUser, users } from "$lib/userStore";
    import { resolveOwner } from "$lib/owner";
    import {
        getJarAllocations,
        resolveJarForTransaction,
        type JarAllocation,
        type JarKey,
    } from "$lib/jars";

    let loading = true;
    let showIntro = true;
    let introLeaving = false;
    let totalIncome = 0;
    let totalExpense = 0;
    let expenseSummary = "";
    let introTimers: Array<ReturnType<typeof setTimeout>> = [];
    type JarProgress = JarAllocation & {
        actual: number;
        delta: number;
        progress: number;
    };
    let jarProgress: JarProgress[] = getJarAllocations(0).map((jar) => ({
        ...jar,
        actual: 0,
        delta: 0,
        progress: 0,
    }));

    interface CategoryTotal {
        category: string;
        amount: number;
        percent: number;
        color: string;
    }
    let expenseByCategory: CategoryTotal[] = [];

    const categoryColors = [
        "#f43f5e", // rose-500
        "#3b82f6", // blue-500
        "#10b981", // emerald-500
        "#f59e0b", // amber-500
        "#8b5cf6", // violet-500
        "#ec4899", // pink-500
        "#06b6d4", // cyan-500
        "#84cc16", // lime-500
        "#6366f1", // indigo-500
        "#f97316", // orange-500
    ];

    interface PieSegment {
        d: string;
        color: string;
    }
    let pieSegments: PieSegment[] = [];

    function computePieSegments(categories: CategoryTotal[]): PieSegment[] {
        let cumulativePercent = 0;
        return categories.map((cat) => {
            const startPercent = cumulativePercent;
            cumulativePercent += cat.percent;
            const x1 = Math.cos(2 * Math.PI * (startPercent / 100));
            const y1 = Math.sin(2 * Math.PI * (startPercent / 100));
            const x2 = Math.cos(2 * Math.PI * (cumulativePercent / 100));
            const y2 = Math.sin(2 * Math.PI * (cumulativePercent / 100));
            const largeArcFlag = cat.percent > 50 ? 1 : 0;
            return {
                d: `M 50 50 L ${50 + 40 * x1} ${50 + 40 * y1} A 40 40 0 ${largeArcFlag} 1 ${50 + 40 * x2} ${50 + 40 * y2} Z`,
                color: cat.color,
            };
        });
    }

    const jarStyles: Record<
        JarKey,
        { bg: string; border: string; text: string; bar: string }
    > = {
        expense: {
            bg: "bg-rose-50",
            border: "border-rose-100",
            text: "text-rose-700",
            bar: "bg-rose-500",
        },
        saving: {
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            text: "text-emerald-700",
            bar: "bg-emerald-500",
        },
        investment: {
            bg: "bg-blue-50",
            border: "border-blue-100",
            text: "text-blue-700",
            bar: "bg-blue-500",
        },
        debt: {
            bg: "bg-amber-50",
            border: "border-amber-100",
            text: "text-amber-700",
            bar: "bg-amber-500",
        },
    };

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Reactive statement to reload data when user changes
    $: if ($currentUser) {
        loadData();
    }

    function clearIntroTimers() {
        introTimers.forEach((timer) => clearTimeout(timer));
        introTimers = [];
    }

    function startIntroSequence() {
        clearIntroTimers();
        showIntro = true;
        introLeaving = false;
        introOverlayState.set("visible");

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const visibleDuration = prefersReducedMotion ? 900 : 1600;
        const leavingDuration = prefersReducedMotion ? 180 : 520;

        introTimers = [
            setTimeout(() => {
                introLeaving = true;
            }, visibleDuration),
            setTimeout(() => {
                showIntro = false;
                introLeaving = false;
                introOverlayState.set("hidden");
                clearIntroTimers();
            }, visibleDuration + leavingDuration),
        ];
    }

    async function loadData() {
        loading = true;
        totalIncome = 0;
        totalExpense = 0;
        expenseSummary = `ยอดรวมเดือน ${currentMonth}/${currentYear}`;
        jarProgress = getJarAllocations(0).map((jar) => ({
            ...jar,
            actual: 0,
            delta: 0,
            progress: 0,
        }));

        // Get transactions for current month
        const startOfMonth = new Date(
            currentYear,
            currentMonth - 1,
            1,
        ).toISOString();
        const endOfMonth = new Date(
            currentYear,
            currentMonth,
            0,
            23,
            59,
            59,
        ).toISOString();
        const { owner } = await resolveOwner(supabase, $currentUser);
        if (!owner) {
            loading = false;
            expenseSummary = "ยังไม่พบผู้ใช้ที่ใช้งานอยู่";
            return;
        }

        const { data: transactions, error: txError } = await supabase
            .from("transactions")
            .select("*")
            .gte("date", startOfMonth)
            .lte("date", endOfMonth)
            .eq("owner", owner);

        if (txError) {
            console.error("Error loading transactions:", txError);
            expenseSummary = getSupabaseErrorMessage("โหลดข้อมูลไม่สำเร็จ", txError);
        }

        if (transactions) {
            const expenses = transactions.filter((t) => t.type === "expense");
            const incomes = transactions.filter((t) => t.type === "income");

            totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
            totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

            const actualByJar: Record<JarKey, number> = {
                expense: 0,
                saving: 0,
                investment: 0,
                debt: 0,
            };

            expenses.forEach((tx) => {
                const resolvedJar = resolveJarForTransaction({
                    jar_key: tx.jar_key,
                    category: tx.category,
                });
                actualByJar[resolvedJar] += tx.amount;
            });

            jarProgress = getJarAllocations(totalIncome).map((jar) => {
                const actual = actualByJar[jar.key];
                const delta = jar.amount - actual;
                const progress = jar.amount > 0 ? (actual / jar.amount) * 100 : 0;
                return { ...jar, actual, delta, progress };
            });

            // Calculate Expense By Category
            const catMap = new Map<string, number>();
            expenses.forEach((tx) => {
                const current = catMap.get(tx.category) || 0;
                catMap.set(tx.category, current + tx.amount);
            });

            expenseByCategory = Array.from(catMap.entries())
                .map(([category, amount], index) => ({
                    category,
                    amount,
                    percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
                    color: categoryColors[index % categoryColors.length],
                }))
                .sort((a, b) => b.amount - a.amount);

            pieSegments = computePieSegments(expenseByCategory);
        }

        loading = false;
    }

    onMount(() => {
        startIntroSequence();
        loadData();

        return () => {
            clearIntroTimers();
            introOverlayState.set("hidden");
        };
    });
</script>

<div class="home-shell">
    {#if showIntro}
        <BmwE36Splash leaving={introLeaving} />
    {/if}

    <div class="home-dashboard space-y-6" class:intro-active={showIntro}>
        <section class="hero-panel p-6 md:p-8">
            <div class="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div class="space-y-3">
                    <div class="eyebrow text-white/65">Monthly Liquidity</div>
                    <div class="flex items-center gap-2 text-sm text-white/75">
                        <span>สวัสดี</span>
                        <span class="font-semibold text-[#f1d892]">{users[$currentUser].name}</span>
                        <span>มาดูภาพรวมการเงินเดือนนี้กัน</span>
                    </div>
                    <h2 class="title-display">฿{totalExpense.toLocaleString()}</h2>
                    <p class="max-w-md text-sm text-white/72">{expenseSummary}</p>
                </div>

                <div class="flex flex-wrap gap-3">
                    <div class="lux-pill">
                        <TrendingUp size={14} />
                        รายรับ ฿{totalIncome.toLocaleString()}
                    </div>
                    <div class="lux-pill">
                        <TrendingDown size={14} />
                        รายจ่าย ฿{totalExpense.toLocaleString()}
                    </div>
                </div>
            </div>
        </section>

        <section class="grid gap-4 md:grid-cols-3">
            <div class="section-card p-5">
                <div class="eyebrow mb-3">Inflow</div>
                <div class="flex items-center gap-3 text-[#235d3b]">
                    <TrendingUp size={22} />
                    <div>
                        <div class="text-2xl font-bold text-[#171411]">
                            ฿{totalIncome.toLocaleString()}
                        </div>
                        <div class="text-sm text-[#6f665c]">รายรับเดือนนี้</div>
                    </div>
                </div>
            </div>
            <div class="section-card p-5">
                <div class="eyebrow mb-3">Outflow</div>
                <div class="flex items-center gap-3 text-[#9b2c2c]">
                    <TrendingDown size={22} />
                    <div>
                        <div class="text-2xl font-bold text-[#171411]">
                            ฿{totalExpense.toLocaleString()}
                        </div>
                        <div class="text-sm text-[#6f665c]">ค่าใช้จ่ายเดือนนี้</div>
                    </div>
                </div>
            </div>
            <div class="section-card p-5">
                <div class="eyebrow mb-3">Net Position</div>
                <div class="flex items-center gap-3 text-[#d8af52]">
                    <Wallet size={22} />
                    <div>
                        <div class="text-2xl font-bold text-[#171411]">
                            ฿{(totalIncome - totalExpense).toLocaleString()}
                        </div>
                        <div class="text-sm text-[#6f665c]">กระแสเงินสุทธิ</div>
                    </div>
                </div>
            </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section class="glass-panel p-5 md:p-6">
                <div class="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <div class="eyebrow mb-2">Automated Allocation</div>
                        <h3 class="text-2xl font-bold text-[#171411]">แผน 4 กระปุก</h3>
                        <p class="mt-1 text-sm text-[#6f665c]">
                            คำนวณจากรายรับเดือนนี้ตามสูตร 40/20/20/20
                        </p>
                    </div>
                    <div class="rounded-full bg-[#f5efdf] px-3 py-1 text-xs font-semibold text-[#8c6a22]">
                        Dynamic
                    </div>
                </div>

                <div class="space-y-3">
                    {#each jarProgress as jar}
                        <div class="section-card p-4">
                            <div class="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <div class="text-sm font-semibold text-[#171411]">
                                        {jar.labelTh}
                                    </div>
                                    <div class="text-xs text-[#6f665c]">
                                        {jar.label} • {Math.round(jar.percent * 100)}%
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xs text-[#6f665c]">Allocated</div>
                                    <div class="font-bold text-[#171411]">
                                        ฿{jar.amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div class="mb-2 h-2.5 overflow-hidden rounded-full bg-[#f2ede4]">
                                <div
                                    style="width: {Math.min(100, Math.max(0, jar.progress))}%"
                                    class="h-2.5 rounded-full {jarStyles[jar.key].bar}"
                                ></div>
                            </div>

                            <div class="flex justify-between text-xs">
                                <span class="text-[#6f665c]">
                                    ใช้งานจริง ฿{jar.actual.toLocaleString()}
                                </span>
                                <span
                                    class={jar.delta >= 0
                                        ? "font-semibold text-[#235d3b]"
                                        : "font-semibold text-[#9b2c2c]"}
                                >
                                    {jar.delta >= 0 ? "เหลือ" : "เกิน"} ฿{Math.abs(
                                        jar.delta,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <section class="section-card p-5 md:p-6">
                <div class="mb-5">
                    <div class="eyebrow mb-2">Expense Distribution</div>
                    <h3 class="text-2xl font-bold text-[#171411]">ค่าใช้จ่ายเดือนนี้</h3>
                </div>

                {#if expenseByCategory.length > 0}
                    <div class="flex flex-col items-center">
                        <div class="relative mb-6 h-52 w-52">
                            <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
                                {#each pieSegments as seg}
                                    <path d={seg.d} fill={seg.color} class="transition-all duration-300 hover:opacity-80" />
                                {/each}
                                <circle cx="50" cy="50" r="25" fill="white" />
                            </svg>
                            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span class="text-2xl font-bold text-[#171411]">
                                    ฿{totalExpense.toLocaleString()}
                                </span>
                                <span class="eyebrow">Spent</span>
                            </div>
                        </div>

                        <div class="w-full space-y-2">
                            {#each expenseByCategory as cat}
                                <div class="flex items-center justify-between rounded-[18px] bg-[#f7f3ec] px-3 py-3 text-sm">
                                    <div class="flex min-w-0 items-center gap-3">
                                        <div class="h-3 w-3 shrink-0 rounded-full" style="background-color: {cat.color}"></div>
                                        <span class="truncate text-[#171411]">
                                            {cat.category.split('(')[0].trim()}
                                        </span>
                                    </div>
                                    <span class="font-semibold text-[#6f665c]">
                                        {cat.percent.toFixed(1)}%
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="rounded-[24px] bg-[#f7f3ec] px-5 py-10 text-center">
                        <TrendingDown size={38} class="mx-auto mb-3 text-[#c9bca7]" />
                        <p class="text-sm text-[#6f665c]">ยังไม่มีค่าใช้จ่ายในเดือนนี้</p>
                    </div>
                {/if}
            </section>
        </div>
    </div>
</div>

<style>
    .home-shell {
        position: relative;
        isolation: isolate;
    }

    .home-dashboard {
        transition:
            transform 0.55s ease,
            filter 0.55s ease,
            opacity 0.55s ease;
    }

    .home-dashboard.intro-active {
        opacity: 0.42;
        filter: blur(12px) saturate(0.85);
        pointer-events: none;
        transform: scale(0.985);
    }

    @media (prefers-reduced-motion: reduce) {
        .home-dashboard {
            transition: opacity 0.18s ease;
        }

        .home-dashboard.intro-active {
            opacity: 0.78;
            filter: none;
            transform: none;
        }
    }
</style>
