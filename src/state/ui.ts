import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

const uiState: Writable<UIData> = writable();

export default uiState;