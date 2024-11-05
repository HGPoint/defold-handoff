import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

const imageState: Writable<WithNull<Uint8Array>> = writable();

export default imageState;