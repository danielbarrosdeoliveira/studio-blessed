<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const toast = useToast()

const {
  data: services,
  status,
  refresh
} = await useFetch<Service[]>('/api/services', {
  default: () => []
})

const formSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  durationMin: z.coerce
    .number()
    .int()
    .min(5, 'Duração mínima de 5 min')
    .max(600, 'Duração máxima de 600 min'),
  bufferMin: z.coerce.number().int().min(0).max(240),
  price: z.coerce.number().min(0, 'Preço inválido'),
  active: z.boolean()
})

type FormSchema = z.output<typeof formSchema>

const formOpen = ref(false)
const saving = ref(false)
const editing = ref<Service | null>(null)

const state = reactive({
  name: '',
  durationMin: '60',
  bufferMin: '0',
  price: '0',
  active: true
})

function resetState() {
  state.name = ''
  state.durationMin = '60'
  state.bufferMin = '0'
  state.price = '0'
  state.active = true
}

function openCreate() {
  editing.value = null
  resetState()
  formOpen.value = true
}

function openEdit(row: Service) {
  editing.value = row
  state.name = row.name
  state.durationMin = String(row.durationMin)
  state.bufferMin = String(row.bufferMin)
  state.price = String(row.priceCents / 100)
  state.active = row.active
  formOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<FormSchema>) {
  const payload = {
    name: event.data.name,
    durationMin: event.data.durationMin,
    bufferMin: event.data.bufferMin,
    priceCents: Math.round(event.data.price * 100),
    active: event.data.active
  }

  saving.value = true

  try {
    if (editing.value) {
      await $fetch(`/api/services/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/services', { method: 'POST', body: payload })
    }

    toast.add({
      title: editing.value ? 'Serviço atualizado' : 'Serviço criado',
      icon: 'i-ri-check-line',
      color: 'success'
    })

    formOpen.value = false
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Não foi possível salvar',
      description: (error as { data?: { message?: string } })?.data?.message ?? 'Tente novamente.',
      icon: 'i-ri-error-warning-line',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function toggleActive(row: Service) {
  try {
    await $fetch(`/api/services/${row.id}`, {
      method: 'PATCH',
      body: { active: !row.active }
    })
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Não foi possível alterar o status',
      description: (error as { data?: { message?: string } })?.data?.message ?? 'Tente novamente.',
      icon: 'i-ri-error-warning-line',
      color: 'error'
    })
  }
}

/* ------------------------------- Tabela -------------------------------- */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatPrice(cents: number) {
  return brl.format(cents / 100)
}

const columns = computed<TableColumn<Service>[]>(() => [
  {
    accessorKey: 'name',
    header: 'Serviço',
    cell: ({ row }) => h('p', { class: 'font-medium text-highlighted' }, row.original.name)
  },
  {
    accessorKey: 'durationMin',
    header: 'Duração',
    cell: ({ row }) => `${row.original.durationMin} min`
  },
  {
    accessorKey: 'bufferMin',
    header: 'Buffer',
    cell: ({ row }) => `${row.original.bufferMin} min`
  },
  {
    accessorKey: 'priceCents',
    header: 'Preço',
    cell: ({ row }) => formatPrice(row.original.priceCents)
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        color: row.original.active ? 'success' : 'neutral',
        variant: 'subtle',
        label: row.original.active ? 'Ativo' : 'Inativo'
      })
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end gap-2' }, [
        h(UButton, {
          label: 'Editar',
          icon: 'i-ri-pencil-line',
          size: 'xs',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => openEdit(row.original)
        }),
        h(UButton, {
          label: row.original.active ? 'Desativar' : 'Ativar',
          icon: 'i-ri-shut-down-line',
          size: 'xs',
          color: row.original.active ? 'error' : 'success',
          variant: 'ghost',
          onClick: () => toggleActive(row.original)
        })
      ])
  }
])
</script>

<template>
  <UDashboardPanel id="services">
    <template #header>
      <UDashboardNavbar title="Serviços">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Abrir agendamento"
            icon="i-ri-external-link-line"
            color="neutral"
            variant="outline"
            to="/agendamento"
            target="_blank"
          />
          <UButton label="Novo serviço" icon="i-ri-add-line" @click="openCreate" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="overflow-x-auto">
        <UTable :data="services" :columns="columns" :loading="status === 'pending'" />
      </div>

      <UCard v-if="status === 'success' && !services.length" class="mt-4">
        <p class="text-center text-sm text-muted">Nenhum serviço cadastrado ainda.</p>
      </UCard>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="formOpen"
    :title="editing ? 'Editar serviço' : 'Novo serviço'"
    :description="
      editing
        ? undefined
        : 'O serviço pertence à dona do salão. Combos são serviços de duração maior.'
    "
  >
    <template #body>
      <UForm :schema="formSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField
          label="Nome"
          name="name"
          required
          description="O nome do serviço é único entre os serviços ativos do salão."
        >
          <UInput
            v-model="state.name"
            class="w-full"
            placeholder="Ex.: Corte, Escova, Combo corte + escova"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Duração (min)" name="durationMin" required>
            <UInput
              v-model="state.durationMin"
              type="number"
              min="5"
              max="600"
              step="5"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Buffer (min)" name="bufferMin" description="Tempo após o atendimento.">
            <UInput
              v-model="state.bufferMin"
              type="number"
              min="0"
              max="240"
              step="5"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Preço (R$)" name="price" required>
          <UInput v-model="state.price" type="number" min="0" step="0.01" class="w-full" />
        </UFormField>

        <UFormField label="Ativo" name="active">
          <USwitch v-model="state.active" />
        </UFormField>

        <UButton
          type="submit"
          :label="editing ? 'Salvar' : 'Criar serviço'"
          block
          :loading="saving"
        />
      </UForm>
    </template>
  </UModal>
</template>
