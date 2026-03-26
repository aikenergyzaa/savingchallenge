import { writable } from "svelte/store";

export type IntroOverlayState = "pending" | "visible" | "hidden";

export const introOverlayState = writable<IntroOverlayState>("pending");
