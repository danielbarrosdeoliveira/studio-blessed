<template>
  <div class="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
    <LandingNavbar />
    <slot />
    <LandingFooter />
  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
}
</style>
