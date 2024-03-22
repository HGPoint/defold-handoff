<script lang="ts">
  export let label: string;
  export let onClick: () => void;
</script>

<button on:click={onClick}>{label}</button>

