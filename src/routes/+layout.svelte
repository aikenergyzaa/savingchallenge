<script lang="ts">
  import "../app.css";
  import { Home, PlusCircle, List, PieChart, Trophy } from "lucide-svelte";
  import { currentUser, users } from "$lib/userStore";
  import { navigating, page } from "$app/stores";

  type NavItem = {
    href: string;
    label: string;
    icon: typeof Home;
    eyebrow: string;
    title: string;
    primary?: boolean;
  };

  function toggleUser() {
    currentUser.update((value) => (value === "bear" ? "rabbit" : "bear"));
  }

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Atelier",
      icon: Home,
      eyebrow: "Saving Challenge",
      title: "Sovereign Savings",
    },
    {
      href: "/transactions",
      label: "Ledger",
      icon: List,
      eyebrow: "Transaction Archive",
      title: "Ledger Flow",
    },
    {
      href: "/add",
      label: "New",
      icon: PlusCircle,
      eyebrow: "Quick Capture",
      title: "Create Entry",
      primary: true,
    },
    {
      href: "/analytics",
      label: "Insights",
      icon: PieChart,
      eyebrow: "Money Signals",
      title: "Insight Studio",
    },
    {
      href: "/game",
      label: "Duel",
      icon: Trophy,
      eyebrow: "Friendly Competition",
      title: "Savings Duel",
    },
  ];

  function matchesPath(href: string, pathname: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isActive(href: string) {
    return matchesPath(href, $page.url.pathname);
  }

  function isVisualActive(href: string) {
    const pendingPath = $navigating?.to?.url.pathname;
    return matchesPath(href, pendingPath || $page.url.pathname);
  }

  function navState(href: string) {
    const pendingPath = $navigating?.to?.url.pathname;
    if (pendingPath && matchesPath(href, pendingPath)) return "pending";
    if (isActive(href)) return "active";
    return "idle";
  }

  $: activeNavItem =
    navItems.find((item) => isVisualActive(item.href)) || navItems[0];
</script>

<div class="app-shell">
  <header class="app-topbar">
    <div class="app-topbar-inner">
      <div class="flex min-w-0 items-center gap-3">
        <div class="h-11 w-11 rounded-full bg-[#1b1612] text-[#d8af52] flex items-center justify-center shadow-lg">
          <span class="text-lg font-black">S</span>
        </div>
        <div class="min-w-0">
          <div class="eyebrow">{activeNavItem.eyebrow}</div>
          <h1 class="truncate text-lg font-bold text-[#171411]">{activeNavItem.title}</h1>
        </div>
      </div>

      <button
        type="button"
        on:pointerup={toggleUser}
        class="flex items-center gap-3 rounded-full border border-[#00000012] bg-white/80 px-3 py-2 shadow-sm transition-all active:scale-95 {users[
          $currentUser
        ].bg}"
        style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
        title="กดเพื่อสลับผู้ใช้"
      >
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4efe5] text-xl">
          {users[$currentUser].emoji}
        </span>
        <div class="flex flex-col items-start leading-none">
          <span class="text-[10px] font-normal uppercase tracking-[0.18em] text-[#6f665c]">Active</span
          >
          <span class="text-sm font-bold {users[$currentUser].color}"
            >{users[$currentUser].name}</span
          >
        </div>
      </button>
    </div>
  </header>

  <main class="app-main">
    <slot />
  </main>

  <nav class="bottom-nav">
    {#each navItems as item}
      <a
        href={item.href}
        class="bottom-nav-link {item.primary ? 'primary-link' : ''} {isVisualActive(item.href)
          ? 'active'
          : ''}"
        data-state={navState(item.href)}
        aria-current={isActive(item.href) ? "page" : undefined}
        aria-label={item.label}
        data-sveltekit-preload-data="tap"
      >
        <span class="bottom-nav-icon-shell" aria-hidden="true">
        <svelte:component this={item.icon} size={item.primary ? 24 : 20} />
        </span>
        {#if !item.primary}
          <span>{item.label}</span>
        {/if}
      </a>
    {/each}
  </nav>
</div>
