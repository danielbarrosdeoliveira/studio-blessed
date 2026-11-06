<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
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
