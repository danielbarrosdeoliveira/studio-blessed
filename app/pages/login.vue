<script setup lang="ts">
import { signInGoogle } from '~/lib/auth-client'

definePageMeta({
  layout: false
})

useHead({
  title: 'Entrar · Studio Blessed'
})

const route = useRoute()

// Se já estiver autenticado no servidor, redireciona para o painel imediatamente
const headers = useRequestHeaders(['cookie'])
const { data: session } = await useFetch<{ user: unknown | null }>('/api/auth/session', {
  headers
})

if (import.meta.server && session.value?.user) {
  const redirect = route.query.redirect as string | undefined
  await navigateTo(redirect ?? '/painel/metricas')
}

const loading = ref(false)
const errorMessage = ref('')

async function onGoogleSignIn() {
  loading.value = true
  errorMessage.value = ''

  try {
    await signInGoogle()
  } catch (error: unknown) {
    loading.value = false
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    
    // Erro comum: origin não autorizado no Google Cloud Console
    if (message.includes('Invalid origin') || message.includes('INVALID_ORIGIN')) {
      errorMessage.value = 'Domínio não autorizado no Google. Configure o "Authorized JavaScript origins" no Google Cloud Console com https://studioblessed.com.br'
    } else {
      errorMessage.value = `Erro ao iniciar login: ${message}`
    }
  }
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
          :disabled="loading"
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