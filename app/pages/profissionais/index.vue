<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import type { Professional } from '~/types/domain'

definePageMeta({
  middleware: ['admin']
})

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const toast = useToast()

const { data: professionals, status, refresh } = await useFetch<Professional[]>('/api/professionals')

/* ------------------------------ Cadastro ------------------------------ */

const createOpen = ref(false)
const creating = ref(false)

const createSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres')
})

type CreateSchema = z.output<typeof createSchema>

const createState = reactive<Partial<CreateSchema>>({
  name: '',
  email: '',
  password: ''
})

async function onCreate(event: FormSubmitEvent<CreateSchema>) {
  creating.value = true

  try {
    await $fetch('/api/professionals', {
      method: 'POST',
      body: event.data
    })

    toast.add({
      title: 'Profissional cadastrada',
      description: 'Ela já pode entrar com o e-mail e a senha informados.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    createOpen.value = false
    Object.assign(createState, { name: '', email: '', password: '' })
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Não foi possível cadastrar',
      description: getErrorMessage(error),
      icon: 'i-lucide-circle-alert',
      color: 'error'
    })
  } finally {
    creating.value = false
  }
}

/* ------------------------------- Edição ------------------------------- */

const editOpen = ref(false)
const editing = ref<Professional | null>(null)
const savingEdit = ref(false)

const editSchema = z.object({
  name: z.string().min(2, 'Informe o nome')
})

type EditSchema = z.output<typeof editSchema>

const editState = reactive<Partial<EditSchema>>({ name: '' })

function openEdit(professional: Professional) {
  editing.value = professional
  editState.name = professional.name
  editOpen.value = true
}

async function onEdit(event: FormSubmitEvent<EditSchema>) {
  if (!editing.value) {
    return
  }

  savingEdit.value = true

  try {
    await $fetch(`/api/professionals/${editing.value.id}`, {
      method: 'PATCH',
      body: event.data
    })

    toast.add({
      title: 'Dados atualizados',
      icon: 'i-lucide-check',
      color: 'success'
    })

    editOpen.value = false
    await refresh()
  } catch (error) {
    toast.add({
      title: 'Não foi possível salvar',
      description: getErrorMessage(error),
      icon: 'i-lucide-circle-alert',
      color: 'error'
    })
  } finally {
    savingEdit.value = false
  }
}

/* ------------------------------- Tabela ------------------------------- */

const columns: TableColumn<Professional>[] = [
  {
    accessorKey: 'name',
    header: 'Profissional',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
      h(UAvatar, {
        alt: row.original.name,
        size: 'md'
      }),
      h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.name),
        h('p', { class: 'text-sm text-muted' }, row.original.email)
      ])
    ])
  },
  {
    accessorKey: 'role',
    header: 'Papel',
    cell: ({ row }) => h(UBadge, {
      color: row.original.role === 'admin' ? 'primary' : 'neutral',
      variant: 'subtle',
      label: row.original.role === 'admin' ? 'Admin' : 'Profissional'
    })
  },
  {
    accessorKey: 'agendaProvider',
    header: 'Agenda',
    cell: ({ row }) => h(UBadge, {
      color: 'neutral',
      variant: 'outline',
      label: row.original.agendaProvider === 'google' ? 'Google' : 'Interna'
    })
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-2' }, [
      h(UButton, {
        label: 'Jornada',
        icon: 'i-lucide-clock',
        size: 'xs',
        color: 'neutral',
        variant: 'outline',
        to: `/profissionais/${row.original.id}`
      }),
      h(UButton, {
        label: 'Editar',
        icon: 'i-lucide-pencil',
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        onClick: () => openEdit(row.original)
      })
    ])
  }
]

function getErrorMessage(error: unknown) {
  const message = (error as { data?: { message?: string } })?.data?.message
  return message ?? 'Tente novamente.'
}
</script>

<template>
  <UDashboardPanel id="professionals">
    <template #header>
      <UDashboardNavbar title="Profissionais">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Nova profissional"
            icon="i-lucide-plus"
            @click="createOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="overflow-x-auto">
        <UTable
          :data="professionals ?? []"
          :columns="columns"
          :loading="status === 'pending'"
        />
      </div>

      <UCard
        v-if="status === 'success' && !professionals?.length"
        class="mt-4"
      >
        <p class="text-sm text-muted text-center">
          Nenhuma profissional cadastrada ainda.
        </p>
      </UCard>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="createOpen"
    title="Nova profissional"
    description="Crie o acesso com uma senha inicial. Ela pode alterá-la depois."
  >
    <template #body>
      <UForm
        :schema="createSchema"
        :state="createState"
        class="space-y-4"
        @submit="onCreate"
      >
        <UFormField
          label="Nome"
          name="name"
          required
        >
          <UInput
            v-model="createState.name"
            class="w-full"
            placeholder="Nome da profissional"
            autocomplete="off"
          />
        </UFormField>

        <UFormField
          label="E-mail"
          name="email"
          required
        >
          <UInput
            v-model="createState.email"
            type="email"
            class="w-full"
            placeholder="profissional@studioblessed.local"
            autocomplete="off"
          />
        </UFormField>

        <UFormField
          label="Senha inicial"
          name="password"
          description="Mínimo de 8 caracteres."
          required
        >
          <UInput
            v-model="createState.password"
            type="password"
            class="w-full"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Cadastrar"
          block
          :loading="creating"
        />
      </UForm>
    </template>
  </UModal>

  <UModal
    v-model:open="editOpen"
    title="Editar profissional"
  >
    <template #body>
      <UForm
        :schema="editSchema"
        :state="editState"
        class="space-y-4"
        @submit="onEdit"
      >
        <UFormField
          label="Nome"
          name="name"
          required
        >
          <UInput
            v-model="editState.name"
            class="w-full"
          />
        </UFormField>

        <UFormField label="E-mail">
          <UInput
            :model-value="editing?.email"
            class="w-full"
            disabled
          />
        </UFormField>

        <UButton
          type="submit"
          label="Salvar"
          block
          :loading="savingEdit"
        />
      </UForm>
    </template>
  </UModal>
</template>
