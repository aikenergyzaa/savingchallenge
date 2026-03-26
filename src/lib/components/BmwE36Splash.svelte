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
                <h2 class="bmw-intro__title">Aik BigLot</h2>
            </div>
        </div>

        <div class="bmw-intro__visual">
            <div class="bmw-intro__photo-frame">
                <img
                    class="bmw-intro__photo"
                    src="/bmw-e36-splash.avif"
                    alt=""
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                />
                <div class="bmw-intro__photo-tint"></div>
                <div class="bmw-intro__lamp bmw-intro__lamp--left"></div>
                <div class="bmw-intro__lamp bmw-intro__lamp--right"></div>
            </div>
            <div class="bmw-intro__roadline"></div>
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
        gap: 0.5rem;
        max-width: 40rem;
        justify-items: center;
        text-align: center;
    }

    .bmw-intro__eyebrow,
    .bmw-intro__brand,
    .bmw-intro__title,
    .bmw-intro__visual {
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

    .bmw-intro__visual {
        animation-delay: 0.22s;
    }

    .bmw-intro__brand {
        color: #f1d892;
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
    }

    .bmw-intro__title {
        margin: 0;
        color: #fff9f0;
        font-size: clamp(2.8rem, 7vw, 5.8rem);
        line-height: 0.96;
        letter-spacing: -0.04em;
        text-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    }

    .bmw-intro__visual {
        position: relative;
        margin-top: 0.35rem;
        padding: 0.8rem 0 0.2rem;
    }

    .bmw-intro__visual::before {
        content: "";
        position: absolute;
        inset: auto 50% 12%;
        width: min(72vw, 34rem);
        height: min(72vw, 34rem);
        transform: translateX(-50%);
        border-radius: 9999px;
        background: radial-gradient(circle, rgba(216, 175, 82, 0.26), transparent 64%);
        filter: blur(52px);
    }

    .bmw-intro__photo-frame {
        position: relative;
        width: min(100%, 28rem);
        aspect-ratio: 5 / 6;
        margin: 0 auto;
        overflow: hidden;
        border-radius: 2rem;
        border: 1px solid rgba(255, 241, 217, 0.14);
        background: #0c0a08;
        box-shadow:
            0 36px 80px rgba(0, 0, 0, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        animation: photoFloat 5.8s ease-in-out infinite;
    }

    .bmw-intro__photo-frame::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid rgba(255, 241, 217, 0.1);
        pointer-events: none;
        z-index: 3;
    }

    .bmw-intro__photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 58%;
        transform: scale(1.03);
        filter: saturate(0.9) contrast(1.02) brightness(0.74);
    }

    .bmw-intro__photo-tint {
        position: absolute;
        inset: 0;
        background:
            linear-gradient(180deg, rgba(5, 5, 5, 0.2) 0%, rgba(5, 5, 5, 0.06) 24%, rgba(5, 5, 5, 0.36) 68%, rgba(5, 5, 5, 0.72) 100%),
            radial-gradient(circle at 50% 74%, rgba(255, 206, 124, 0.1), transparent 20%),
            radial-gradient(circle at 50% 20%, rgba(255, 243, 219, 0.12), transparent 22%);
        z-index: 1;
        pointer-events: none;
    }

    .bmw-intro__lamp {
        position: absolute;
        top: 63%;
        width: 3.2rem;
        height: 3.2rem;
        border-radius: 9999px;
        background: radial-gradient(circle, rgba(255, 220, 163, 0.88) 0%, rgba(255, 208, 119, 0.38) 38%, transparent 76%);
        filter: blur(10px);
        mix-blend-mode: screen;
        opacity: 0;
        animation: lampGlow 1s ease-out 0.65s forwards;
        z-index: 2;
        pointer-events: none;
    }

    .bmw-intro__lamp--left {
        left: 31%;
    }

    .bmw-intro__lamp--right {
        right: 31%;
    }

    .bmw-intro__roadline {
        width: min(100%, 24rem);
        height: 0.35rem;
        margin: 1rem auto 0;
        border-radius: 9999px;
        background: linear-gradient(90deg, transparent 0%, rgba(243, 200, 118, 0.1) 14%, rgba(255, 224, 160, 0.65) 50%, rgba(243, 200, 118, 0.1) 86%, transparent 100%);
        box-shadow: 0 0 22px rgba(243, 200, 118, 0.22);
    }

    @keyframes introRise {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes photoFloat {
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

    @keyframes lampGlow {
        to {
            opacity: 0.82;
        }
    }

    @media (max-width: 640px) {
        .bmw-intro__content {
            gap: 1rem;
            padding-top: max(1.5rem, env(safe-area-inset-top));
            padding-bottom: max(1.6rem, env(safe-area-inset-bottom));
        }

        .bmw-intro__photo-frame {
            width: min(100%, 21rem);
            border-radius: 1.7rem;
        }

        .bmw-intro__lamp {
            top: 62%;
            width: 2.5rem;
            height: 2.5rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .bmw-intro,
        .bmw-intro__eyebrow,
        .bmw-intro__brand,
        .bmw-intro__title,
        .bmw-intro__visual,
        .bmw-intro__glow--left,
        .bmw-intro__glow--right,
        .bmw-intro__photo-frame,
        .bmw-intro__lamp {
            animation: none;
        }

        .bmw-intro__eyebrow,
        .bmw-intro__brand,
        .bmw-intro__title,
        .bmw-intro__visual,
        .bmw-intro__lamp {
            opacity: 1;
            transform: none;
        }

        .bmw-intro.leaving {
            transform: none;
            filter: none;
        }
    }
</style>
