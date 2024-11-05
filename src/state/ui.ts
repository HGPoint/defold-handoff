import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

const uiState: Writable<UIData> = writable();

export default uiState;