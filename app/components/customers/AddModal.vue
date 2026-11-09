<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { normalizePhoneDigits } from '~/utils/phone'

const schema = z.object({
  name: z.string().min(2, 'Muito curto'),
  phone: z.string().min(10, 'Informe o WhatsApp com DDD')
})

const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  phone: ''
})

const phoneValid = computed(() => state.phone && normalizePhoneDigits(state.phone) !== null)

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch('/api/clientes', {
      method: 'POST',
      body: event.data
    })

    toast.add({
      title: 'Sucesso',
      description: `Nova cliente ${event.data.name} cadastrada com sucesso!`,
      color: 'success'
    })
    open.value = false
    state.name = ''
    state.phone = ''
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message ?? 'Tente novamente.'
    toast.add({
      title: 'Erro',
      description: message,
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Nova Cliente"
    description="Cadastrar uma nova cliente no salão"
  >
    <UButton label="Nova Cliente" icon="i-ri-add-line" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nome" placeholder="Maria Silva" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField
          label="WhatsApp"
          placeholder="(11) 99999-9999"
          name="phone"
          required
          help="Usamos o WhatsApp para identificar a cliente"
        >
          <UInput
            v-model="state.phone"
            type="tel"
            class="w-full"
            :class="{ 'border-error': state.phone && !phoneValid }"
          />
          <p v-if="state.phone && !phoneValid" class="mt-1 text-xs text-error">
            Informe um WhatsApp válido com DDD.
          </p>
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Cancelar" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Cadastrar" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
