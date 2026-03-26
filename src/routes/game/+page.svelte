<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import {
    Trophy,
    Flame,
    ShieldCheck,
    Swords,
    TrendingDown,
    PiggyBank,
  } from "lucide-svelte";
  import { users } from "$lib/userStore";

  let loading = true;

  // Stats
  let bearStreak = 0;
  let rabbitStreak = 0;
  let bearExpense = 0;
  let rabbitExpense = 0;
  let bearSavings = 0;
  let rabbitSavings = 0;

  // Winners
  let streakWinner = "";
  let expenseWinner = "";
  let savingsWinner = "";

  onMount(async () => {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("date, category, type, owner, amount")
      .order("date", { ascending: false });

    if (error) console.error(error);

    if (transactions) {
      // 1. Streak Battle (All time)
      bearStreak = calculateLoggingStreak(transactions, "bear");
      rabbitStreak = calculateLoggingStreak(transactions, "rabbit");
      streakWinner = determineWinner(bearStreak, rabbitStreak, "high");

      // Filter for Current Month
      const today = new Date();
      const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
      const monthlyTx = transactions.filter((t) =>
        t.date.startsWith(currentMonthStr),
      );

      // 2. Expense Battle (Current Month)
      bearExpense = calculateTotal(monthlyTx, "bear", "expense");
      rabbitExpense = calculateTotal(monthlyTx, "rabbit", "expense");
      expenseWinner = determineWinner(bearExpense, rabbitExpense, "low");

      // 3. Savings Battle (Current Month)
      const bearIncome = calculateTotal(monthlyTx, "bear", "income");
      const rabbitIncome = calculateTotal(monthlyTx, "rabbit", "income");
      bearSavings = bearIncome - bearExpense;
      rabbitSavings = rabbitIncome - rabbitExpense;
      savingsWinner = determineWinner(bearSavings, rabbitSavings, "high");
    }
    loading = false;
  });

  function calculateTotal(
    transactions: any[],
    owner: string,
    type: "income" | "expense",
  ) {
    return transactions
      .filter((t) => t.owner === owner && t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  function determineWinner(
    val1: number,
    val2: number,
    criteria: "high" | "low",
  ) {
    if (val1 === val2) return "draw";
    if (criteria === "high") return val1 > val2 ? "bear" : "rabbit";
    return val1 < val2 ? "bear" : "rabbit";
  }

  function calculateLoggingStreak(transactions: any[], owner: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userTx = transactions.filter((t) => t.owner === owner);
    const txDates = new Set(userTx.map((t) => t.date));

    let current = new Date(today);
    let streak = 0;

    const todayStr = current.toISOString().split("T")[0];
    if (!txDates.has(todayStr)) {
      current.setDate(current.getDate() - 1);
    }

    while (true) {
      const dateStr = current.toISOString().split("T")[0];
      if (txDates.has(dateStr)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }
</script>

<div class="space-y-8 pb-10">
  <section class="hero-panel p-6 md:p-8 text-center">
    <div class="relative z-10">
      <div class="eyebrow text-white/65">Challenge Zone</div>
      <Trophy class="mx-auto mb-3 mt-3 h-16 w-16 text-[#f1d892]" />
      <h2 class="text-4xl font-extrabold tracking-tight text-white">Savings Duel</h2>
      <p class="mt-2 text-sm text-white/72">แข่งกันออม ใครจะแน่กว่ากัน!</p>
    </div>
  </section>

  {#if loading}
    <div class="section-card py-10 text-center text-[#6f665c]">กำลังคำนวณสถิติ...</div>
  {:else}
    <!-- 1. Logging Streak Battle -->
    <div
      class="glass-panel overflow-hidden"
    >
      <div
        class="bg-[#171411] p-4 text-center font-bold text-white flex items-center justify-center gap-2"
      >
        <Flame size={20} class="text-orange-400" />
        Logging Streak Battle
      </div>
      <div class="grid grid-cols-2 divide-x divide-[#00000010]">
        <!-- Bear -->
        <div
          class="p-6 flex flex-col items-center {streakWinner === 'bear'
            ? 'bg-[#fff5e8]'
            : ''}"
        >
          <div class="text-4xl mb-2">{users.bear.emoji}</div>
          <div class="font-bold text-slate-700 mb-1">{users.bear.name}</div>
          <div class="text-3xl font-bold text-orange-500">{bearStreak}</div>
          <div class="text-xs text-slate-400">วัน</div>
          {#if streakWinner === "bear"}
            <div
              class="mt-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold"
            >
              WINNER 👑
            </div>
          {/if}
        </div>
        <!-- Rabbit -->
        <div
          class="p-6 flex flex-col items-center {streakWinner === 'rabbit'
            ? 'bg-[#fff2f4]'
            : ''}"
        >
          <div class="text-4xl mb-2">{users.rabbit.emoji}</div>
          <div class="font-bold text-slate-700 mb-1">{users.rabbit.name}</div>
          <div class="text-3xl font-bold text-pink-500">{rabbitStreak}</div>
          <div class="text-xs text-slate-400">วัน</div>
          {#if streakWinner === "rabbit"}
            <div
              class="mt-2 text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-bold"
            >
              WINNER 👑
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- 2. Expense Battle (Low wins) -->
    <div
      class="glass-panel overflow-hidden"
    >
      <div
        class="bg-[#171411] p-4 text-center font-bold text-white flex items-center justify-center gap-2"
      >
        <TrendingDown size={20} class="text-red-400" />
        Expense Battle (เดือนนี้)
      </div>
      <div class="bg-[#f7f3ec] p-2 text-center text-xs text-[#6f665c]">
        ใครจ่ายน้อยกว่าชนะ!
      </div>
      <div class="grid grid-cols-2 divide-x divide-[#00000010]">
        <!-- Bear -->
        <div
          class="p-6 flex flex-col items-center {expenseWinner === 'bear'
            ? 'bg-[#fff5e8]'
            : ''}"
        >
          <div class="text-4xl mb-2">{users.bear.emoji}</div>
          <div class="font-bold text-slate-700 mb-1">{users.bear.name}</div>
          <div class="text-xl font-bold text-orange-500">
            ฿{bearExpense.toLocaleString()}
          </div>
          {#if expenseWinner === "bear"}
            <div
              class="mt-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold"
            >
              WINNER 👑
            </div>
          {/if}
        </div>
        <!-- Rabbit -->
        <div
          class="p-6 flex flex-col items-center {expenseWinner === 'rabbit'
            ? 'bg-[#fff2f4]'
            : ''}"
        >
          <div class="text-4xl mb-2">{users.rabbit.emoji}</div>
          <div class="font-bold text-slate-700 mb-1">{users.rabbit.name}</div>
          <div class="text-xl font-bold text-pink-500">
            ฿{rabbitExpense.toLocaleString()}
          </div>
          {#if expenseWinner === "rabbit"}
            <div
              class="mt-2 text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-bold"
            >
              WINNER 👑
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- 3. Savings Battle (High wins) -->
    <div
      class="glass-panel overflow-hidden"
    >
      <div
        class="bg-[#171411] p-4 text-center font-bold text-white flex items-center justify-center gap-2"
      >
        <PiggyBank size={20} class="text-emerald-400" />
        Savings Battle (เดือนนี้)
      </div>
      <div class="bg-[#f7f3ec] p-2 text-center text-xs text-[#6f665c]">
        ใครเหลือเงินเยอะกว่าชนะ!
      </div>
      <div class="grid grid-cols-2 divide-x divide-[#00000010]">
        <!-- Bear -->
        <div
          class="p-6 flex flex-col items-center {savingsWinner === 'bear'
            ? 'bg-[#fff5e8]'
            : ''}"
        >
          <div class="text-4xl mb-2">{users.bear.emoji}</div>
          <div class="font-bold text-slate-700 mb-1">{users.bear.name}</div>
          <div class="text-xl font-bold text-orange-500">
            ฿{bearSavings.toLocaleString()}
          </div>
          {#if savingsWinner === "bear"}
            <div
              class="mt-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold"
            >
              WINNER 👑
            </div>
          {/if}
        </div>
        <!-- Rabbit -->
        <div
          class="p-6 flex flex-col items-center {savingsWinner === 'rabbit'
            ? 'bg-[#fff2f4]'
            : ''}"
        >
          <div class="text-4xl mb-2">{users.rabbit.emoji}</div>
          <div class="font-bold text-slate-700 mb-1">{users.rabbit.name}</div>
          <div class="text-xl font-bold text-pink-500">
            ฿{rabbitSavings.toLocaleString()}
          </div>
          {#if savingsWinner === "rabbit"}
            <div
              class="mt-2 text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-bold"
            >
              WINNER 👑
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
