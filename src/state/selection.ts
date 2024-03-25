import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

const selectionState: Writable<SelectionUIData> = writable();

export default selectionState;