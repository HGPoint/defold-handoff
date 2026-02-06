import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

const clipboardState: Writable<WithNull<string>> = writable();

export default clipboardState;