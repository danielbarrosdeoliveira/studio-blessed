<script setup lang="ts">
import { authClient, signInGoogle } from '~/lib/auth-client'

definePageMeta({
  layout: false
})

useHead({
  title: 'Entrar · Studio Blessed'
})

const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')

const redirectTo = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') ? value : '/'
})

async function onGoogleSignIn() {
  loading.value = true
  errorMessage.value = ''
  await signInGoogle()
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-default px-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 flex flex-col items-center gap-1">
        <div class="flex size-12 items-center justify-center rounded-xl bg-primary">
          <UIcon name="i-ri-scissors-line" class="size-6 text-white" />
        </div>
        <h1 class="text-xl font-semibold text-highlighted">Studio Blessed</h1>
        <p class="text-sm text-muted">Entre para gerenciar a agenda</p>
      </div>

      <UCard>
        <UButton
          type="button"
          variant="solid"
          color="neutral"
          block
          :loading="loading"
          icon="i-simple-icons-google"
          label="Continuar com Google"
          @click="onGoogleSignIn"
        />

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-ri-error-warning-line"
          :title="errorMessage"
          class="mt-4"
        />
      </UCard>

      <p class="mt-6 text-center text-xs text-muted">Acesso restrito à equipe do Studio Blessed.</p>
    </div>
  </div>
</template>