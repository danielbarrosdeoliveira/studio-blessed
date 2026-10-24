<script setup lang="ts">
import { authClient } from '~/lib/auth-client'

definePageMeta({
  layout: false
})

useHead({
  title: 'Entrar · Studio Blessed'
})

const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const redirectTo = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') ? value : '/'
})

async function onSubmit() {
  loading.value = true
  errorMessage.value = ''

  const { error } = await authClient.signIn.email({
    email: email.value,
    password: password.value
  })

  loading.value = false

  if (error) {
    errorMessage.value = error.message || 'Não foi possível entrar. Verifique suas credenciais.'
    return
  }

  await navigateTo(redirectTo.value)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-default px-4">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center gap-1 mb-8">
        <div class="size-12 rounded-xl bg-primary flex items-center justify-center">
          <UIcon
            name="i-ri-scissors-line"
            class="size-6 text-white"
          />
        </div>
        <h1 class="text-xl font-semibold text-highlighted">
          Studio Blessed
        </h1>
        <p class="text-sm text-muted">
          Entre para gerenciar a agenda
        </p>
      </div>

      <UCard>
        <form
          class="space-y-4"
          @submit.prevent="onSubmit"
        >
          <UFormField
            label="E-mail"
            name="email"
          >
            <UInput
              v-model="email"
              type="email"
              placeholder="voce@studioblessed.local"
              icon="i-ri-mail-line"
              autocomplete="email"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Senha"
            name="password"
          >
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              icon="i-ri-lock-line"
              autocomplete="current-password"
              required
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="errorMessage"
            color="error"
            variant="subtle"
            icon="i-ri-error-warning-line"
            :title="errorMessage"
          />

          <UButton
            type="button"
            label="Entrar"
            icon="i-ri-login-box-line"
            block
            :loading="loading"
            @click="onSubmit"
          />
        </form>
      </UCard>

      <p class="text-center text-xs text-muted mt-6">
        Acesso restrito à equipe do Studio Blessed.
      </p>
    </div>
  </div>
</template>
