import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

const imageState: Writable<Uint8Array | null> = writable();

export default imageState;