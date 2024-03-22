<script lang="ts">
  export let label: string;
  export let onClick: () => void;
  export let disabled = false;
</script>

<button on:click={onClick} {disabled}>{label}</button>

