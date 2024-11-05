import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

const selectionState: Writable<SelectionUIData> = writable();

export default selectionState;