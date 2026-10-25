<template>
  <div class="page-landing min-h-screen bg-[#ffffff] text-[#0f172a] overflow-x-hidden">
    <LNavbar />
    <slot />
    <LFooter />
  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
}
</style>
