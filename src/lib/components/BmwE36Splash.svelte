<script lang="ts">
    export let leaving = false;
</script>

<div class:leaving class="bmw-intro" role="presentation" aria-hidden="true">
    <div class="bmw-intro__backdrop"></div>
    <div class="bmw-intro__grid"></div>
    <div class="bmw-intro__glow bmw-intro__glow--left"></div>
    <div class="bmw-intro__glow bmw-intro__glow--right"></div>

    <div class="bmw-intro__content">
        <div class="bmw-intro__copy">
            <div class="eyebrow bmw-intro__eyebrow">Ignition Sequence</div>
            <div class="bmw-intro__title-block">
                <p class="bmw-intro__brand">BMW E36</p>
                <h2 class="bmw-intro__title">Midnight Icon</h2>
                <p class="bmw-intro__tagline">Classic lines. Focused momentum.</p>
            </div>
        </div>

        <div class="bmw-intro__car-shell">
            <svg
                class="bmw-intro__car"
                viewBox="0 0 1200 420"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="bmw-e36-stroke" x1="160" y1="90" x2="990" y2="340">
                        <stop offset="0%" stop-color="#f6deb2" />
                        <stop offset="45%" stop-color="#c8963e" />
                        <stop offset="100%" stop-color="#7c5920" />
                    </linearGradient>
                    <linearGradient id="bmw-e36-fill" x1="142" y1="152" x2="1002" y2="315">
                        <stop offset="0%" stop-color="rgba(255,255,255,0.2)" />
                        <stop offset="100%" stop-color="rgba(112,79,27,0.02)" />
                    </linearGradient>
                    <filter id="bmw-e36-shadow" x="-15%" y="-35%" width="130%" height="180%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="9" />
                    </filter>
                </defs>

                <ellipse
                    cx="602"
                    cy="346"
                    rx="364"
                    ry="28"
                    fill="rgba(0,0,0,0.48)"
                    filter="url(#bmw-e36-shadow)"
                />

                <path
                    class="bmw-intro__car-outline"
                    d="M142 284C158 280 186 267 215 248L282 206C306 191 338 182 386 181H533C552 154 590 120 648 112C727 101 790 127 832 173L898 183C937 189 968 211 989 241L1058 254C1083 260 1098 273 1104 289H1029C1019 333 984 362 939 362C893 362 857 333 847 289H470C461 333 425 362 379 362C334 362 298 333 289 289H142V284Z"
                    fill="url(#bmw-e36-fill)"
                    stroke="url(#bmw-e36-stroke)"
                    stroke-width="9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />

                <path
                    class="bmw-intro__car-detail"
                    d="M359 184L533 184"
                    stroke="rgba(255,255,255,0.25)"
                    stroke-width="5"
                    stroke-linecap="round"
                />
                <path
                    class="bmw-intro__car-detail"
                    d="M558 182C580 147 618 129 667 123C730 114 781 131 816 169"
                    stroke="rgba(255,255,255,0.22)"
                    stroke-width="5"
                    stroke-linecap="round"
                />
                <path
                    class="bmw-intro__car-detail"
                    d="M703 132L659 134C637 136 617 146 603 163L583 186"
                    stroke="rgba(255,255,255,0.22)"
                    stroke-width="4"
                    stroke-linecap="round"
                />
                <path
                    class="bmw-intro__car-detail"
                    d="M724 134C756 141 782 154 806 177"
                    stroke="rgba(255,255,255,0.18)"
                    stroke-width="4"
                    stroke-linecap="round"
                />
                <path
                    class="bmw-intro__car-detail"
                    d="M242 262L313 261"
                    stroke="rgba(255,255,255,0.18)"
                    stroke-width="4"
                    stroke-linecap="round"
                />
                <path
                    class="bmw-intro__car-detail"
                    d="M1004 266H1070"
                    stroke="rgba(255,255,255,0.18)"
                    stroke-width="4"
                    stroke-linecap="round"
                />

                <circle cx="379" cy="289" r="56" fill="#0c0a08" stroke="#f0d3a0" stroke-width="7" />
                <circle cx="379" cy="289" r="27" fill="#221c15" stroke="rgba(255,255,255,0.2)" stroke-width="3" />
                <circle cx="939" cy="289" r="56" fill="#0c0a08" stroke="#f0d3a0" stroke-width="7" />
                <circle cx="939" cy="289" r="27" fill="#221c15" stroke="rgba(255,255,255,0.2)" stroke-width="3" />

                <path
                    class="bmw-intro__car-accent"
                    d="M308 245H438"
                    stroke="#ffd48c"
                    stroke-width="6"
                    stroke-linecap="round"
                />
                <path
                    class="bmw-intro__car-accent"
                    d="M864 247H963"
                    stroke="#ffd48c"
                    stroke-width="6"
                    stroke-linecap="round"
                />
            </svg>
        </div>

        <div class="bmw-intro__footer">
            <span>Sovereign Savings</span>
            <span>Crafted Entry Experience</span>
        </div>
    </div>
</div>

<style>
    .bmw-intro {
        position: fixed;
        inset: 0;
        z-index: 70;
        overflow: hidden;
        background:
            radial-gradient(circle at top left, rgba(216, 175, 82, 0.22), transparent 30%),
            radial-gradient(circle at 82% 20%, rgba(255, 240, 211, 0.12), transparent 16%),
            linear-gradient(145deg, #0e0b09 0%, #1b1510 38%, #090807 100%);
        transition:
            opacity 0.55s ease,
            transform 0.55s ease,
            filter 0.55s ease;
    }

    .bmw-intro.leaving {
        opacity: 0;
        transform: scale(1.02);
        filter: blur(12px);
        pointer-events: none;
    }

    .bmw-intro__backdrop,
    .bmw-intro__grid,
    .bmw-intro__glow {
        position: absolute;
        inset: 0;
    }

    .bmw-intro__backdrop {
        background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 20%),
            radial-gradient(circle at bottom center, rgba(214, 158, 46, 0.14), transparent 28%);
        opacity: 0.9;
    }

    .bmw-intro__grid {
        background-image:
            linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
        background-size: 100% 72px, 72px 100%;
        mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.25) 100%);
        opacity: 0.18;
    }

    .bmw-intro__glow {
        border-radius: 9999px;
        filter: blur(84px);
        opacity: 0.48;
    }

    .bmw-intro__glow--left {
        inset: auto auto 12% -8%;
        width: 20rem;
        height: 20rem;
        background: rgba(216, 175, 82, 0.4);
        animation: pulseGlow 6s ease-in-out infinite;
    }

    .bmw-intro__glow--right {
        inset: 10% -6% auto auto;
        width: 16rem;
        height: 16rem;
        background: rgba(255, 244, 224, 0.18);
        animation: pulseGlow 7s ease-in-out infinite reverse;
    }

    .bmw-intro__content {
        position: relative;
        z-index: 1;
        display: grid;
        min-height: 100%;
        align-content: center;
        gap: 1.5rem;
        width: min(100%, 76rem);
        margin: 0 auto;
        padding:
            max(2rem, env(safe-area-inset-top))
            clamp(1.25rem, 4vw, 3rem)
            max(2rem, env(safe-area-inset-bottom));
    }

    .bmw-intro__copy {
        display: grid;
        gap: 0.6rem;
        max-width: 38rem;
    }

    .bmw-intro__eyebrow,
    .bmw-intro__brand,
    .bmw-intro__title,
    .bmw-intro__tagline,
    .bmw-intro__car-shell,
    .bmw-intro__footer {
        opacity: 0;
        transform: translateY(18px);
        animation: introRise 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .bmw-intro__brand {
        animation-delay: 0.08s;
    }

    .bmw-intro__title {
        animation-delay: 0.14s;
    }

    .bmw-intro__tagline {
        animation-delay: 0.22s;
    }

    .bmw-intro__car-shell {
        animation-delay: 0.3s;
    }

    .bmw-intro__footer {
        animation-delay: 0.42s;
    }

    .bmw-intro__brand {
        color: #f1d892;
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
    }

    .bmw-intro__title {
        margin: 0;
        color: #fff9f0;
        font-size: clamp(2.9rem, 8vw, 6.6rem);
        line-height: 0.94;
        letter-spacing: -0.05em;
        text-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    }

    .bmw-intro__tagline {
        margin: 0.4rem 0 0;
        color: rgba(255, 247, 232, 0.72);
        font-size: clamp(0.95rem, 2vw, 1.05rem);
        letter-spacing: 0.04em;
    }

    .bmw-intro__car-shell {
        position: relative;
        margin-top: 0.8rem;
        padding: 1rem 0 0.5rem;
    }

    .bmw-intro__car-shell::before {
        content: "";
        position: absolute;
        inset: 16% 8% auto;
        height: 45%;
        background: radial-gradient(circle, rgba(216, 175, 82, 0.22), transparent 66%);
        filter: blur(44px);
    }

    .bmw-intro__car {
        position: relative;
        display: block;
        width: min(100%, 70rem);
        height: auto;
        margin: 0 auto;
        filter: drop-shadow(0 36px 58px rgba(0, 0, 0, 0.42));
        animation: carFloat 5.8s ease-in-out infinite;
    }

    .bmw-intro__car-outline {
        stroke-dasharray: 2700;
        stroke-dashoffset: 2700;
        animation:
            carOutline 1.4s ease-out 0.38s forwards,
            shimmerLine 4.5s ease-in-out 1.7s infinite;
    }

    .bmw-intro__car-detail {
        opacity: 0;
        animation: fadeInSoft 0.9s ease-out 0.85s forwards;
    }

    .bmw-intro__car-accent {
        opacity: 0;
        filter: drop-shadow(0 0 8px rgba(255, 212, 140, 0.7));
        animation: fadeInSoft 0.7s ease-out 1s forwards;
    }

    .bmw-intro__footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.8rem 1.25rem;
        padding-top: 0.3rem;
        color: rgba(255, 244, 224, 0.5);
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
    }

    @keyframes introRise {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeInSoft {
        to {
            opacity: 1;
        }
    }

    @keyframes carFloat {
        0%,
        100% {
            transform: translate3d(0, 0, 0);
        }
        50% {
            transform: translate3d(0, -8px, 0);
        }
    }

    @keyframes pulseGlow {
        0%,
        100% {
            opacity: 0.34;
            transform: scale(1);
        }
        50% {
            opacity: 0.56;
            transform: scale(1.08);
        }
    }

    @keyframes carOutline {
        to {
            stroke-dashoffset: 0;
        }
    }

    @keyframes shimmerLine {
        0%,
        100% {
            filter: drop-shadow(0 0 0 rgba(255, 215, 141, 0.12));
        }
        50% {
            filter: drop-shadow(0 0 12px rgba(255, 215, 141, 0.42));
        }
    }

    @media (max-width: 640px) {
        .bmw-intro__content {
            gap: 1.15rem;
            padding-top: max(1.5rem, env(safe-area-inset-top));
            padding-bottom: max(1.6rem, env(safe-area-inset-bottom));
        }

        .bmw-intro__footer {
            justify-content: flex-start;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .bmw-intro,
        .bmw-intro__eyebrow,
        .bmw-intro__brand,
        .bmw-intro__title,
        .bmw-intro__tagline,
        .bmw-intro__car-shell,
        .bmw-intro__footer,
        .bmw-intro__glow--left,
        .bmw-intro__glow--right,
        .bmw-intro__car,
        .bmw-intro__car-outline,
        .bmw-intro__car-detail,
        .bmw-intro__car-accent {
            animation: none;
        }

        .bmw-intro__eyebrow,
        .bmw-intro__brand,
        .bmw-intro__title,
        .bmw-intro__tagline,
        .bmw-intro__car-shell,
        .bmw-intro__footer,
        .bmw-intro__car-detail,
        .bmw-intro__car-accent {
            opacity: 1;
            transform: none;
        }

        .bmw-intro__car-outline {
            opacity: 1;
            stroke-dashoffset: 0;
        }

        .bmw-intro.leaving {
            transform: none;
            filter: none;
        }
    }
</style>
