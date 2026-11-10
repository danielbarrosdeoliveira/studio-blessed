<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import { formatPhone } from '~/utils/phone'
import { formatIsoDateLong, isoDateOfInstant } from '~/utils/date'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const UBadge = resolveComponent('UBadge')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addModal = ref<any>(null)

const columnFilters = ref([
  {
    id: 'name',
    value: ''
  },
  {
    id: 'phone',
    value: ''
  }
])
const columnVisibility = ref()
const rowSelection = ref({})

interface Client {
  id: string
  name: string
  phone: string
  blocked: boolean
  createdAt: string
}

const { data, status, refresh } = await useFetch<Client[]>('/api/clientes', {
  lazy: true
})

/* --------------------------- Ações por linha --------------------------- */

const appointmentsOpen = ref(false)
const viewingClient = ref<Client | null>(null)

const blockOpen = ref(false)
const blockTarget = ref<Client | null>(null)
const blockState = ref(true)

const bulkOpen = ref(false)

const selectedClients = computed<Client[]>(() =>
  (table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => row.original as Client
  )
)

/** Alvo do bloqueio em massa: desbloqueia quando todas as selecionadas já estão bloqueadas. */
const selectedAllBlocked = computed(
  () => selectedClients.value.length > 0 && selectedClients.value.every((item) => item.blocked)
)

async function onBulkChanged() {
  rowSelection.value = {}
  await refresh()
}

function viewAppointments(row: Row<Client>) {
  viewingClient.value = row.original
  appointmentsOpen.value = true
}

function confirmBlock(row: Row<Client>) {
  blockTarget.value = row.original
  blockState.value = !row.original.blocked
  blockOpen.value = true
}

function getRowItems(row: Row<Client>) {
  const blocked = row.original.blocked

  return [
    {
      type: 'label',
      label: 'Ações'
    },
    {
      label: 'Ver agendamentos da cliente',
      icon: 'i-ri-calendar-line',
      onSelect() {
        viewAppointments(row)
      }
    },
    {
      type: 'separator'
    },
    {
      label: blocked ? 'Desbloquear cliente' : 'Bloquear cliente',
      icon: blocked ? 'i-ri-lock-unlock-line' : 'i-ri-forbid-line',
      color: blocked ? undefined : 'error',
      onSelect() {
        confirmBlock(row)
      }
    }
  ]
}

const columns: TableColumn<Client>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Selecionar todas'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        ariaLabel: 'Selecionar linha'
      })
  },
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1.5' }, [
        h('p', { class: 'truncate font-medium text-highlighted' }, row.original.name),
        ...(row.original.blocked
          ? [
              h(UBadge, {
                color: 'warning',
                variant: 'subtle',
                label: 'Bloqueada'
              })
            ]
          : [])
      ])
  },
  {
    accessorKey: 'phone',
    header: 'WhatsApp',
    cell: ({ row }) =>
      h('p', { class: 'font-medium text-highlighted' }, formatPhone(row.original.phone))
  },
  {
    accessorKey: 'createdAt',
    header: 'Cadastrada em',
    cell: ({ row }) =>
      h(
        'p',
        { class: 'text-sm text-muted' },
        formatIsoDateLong(isoDateOfInstant(row.original.createdAt))
      )
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h('div', { class: 'text-right' }, [
        h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-ri-more-2-line',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      ])
  }
]

const nameFilter = computed({
  get: (): string => (table.value?.tableApi?.getColumn('name')?.getFilterValue() as string) || '',
  set: (value: string) =>
    table.value?.tableApi?.getColumn('name')?.setFilterValue(value || undefined)
})

const phoneFilter = computed({
  get: (): string => (table.value?.tableApi?.getColumn('phone')?.getFilterValue() as string) || '',
  set: (value: string) =>
    table.value?.tableApi?.getColumn('phone')?.setFilterValue(value || undefined)
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Clientes">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="nameFilter"
          class="max-w-sm"
          icon="i-ri-search-line"
          placeholder="Filtrar por nome..."
        />
        <UInput
          v-model="phoneFilter"
          class="max-w-sm"
          icon="i-ri-phone-line"
          placeholder="Filtrar por WhatsApp..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <CustomersBlockModal
            v-model:open="bulkOpen"
            :clients="selectedClients"
            :blocked="!selectedAllBlocked"
            @changed="onBulkChanged"
          >
            <UButton
              v-if="selectedClients.length"
              :label="selectedAllBlocked ? 'Desbloquear' : 'Bloquear'"
              :icon="selectedAllBlocked ? 'i-ri-lock-unlock-line' : 'i-ri-forbid-line'"
              color="error"
              variant="subtle"
            >
              <template #trailing>
                <UKbd>
                  {{ selectedClients.length }}
                </UKbd>
              </template>
            </UButton>
          </CustomersBlockModal>

          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Exibir"
              color="neutral"
              variant="outline"
              trailing-icon="i-ri-settings-3-line"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <UCard v-if="status === 'success' && !data?.length" class="mt-4">
        <div class="flex flex-col items-center gap-3 py-8 text-center">
          <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
            <UIcon name="i-ri-user-line" class="size-6 text-muted" />
          </div>
          <div>
            <p class="font-medium text-highlighted">Nenhuma cliente cadastrada</p>
            <p class="text-sm text-muted">Clique em "Nova Cliente" para adicionar.</p>
          </div>
          <UButton
            label="Nova Cliente"
            icon="i-ri-add-line"
            size="sm"
            @click="
              () => {
                if (addModal.value) addModal.value.open = true
              }
            "
          />
        </div>
      </UCard>

      <div class="mt-auto flex items-center justify-between gap-3 border-t border-default pt-4">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} de
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} linha(s) selecionada(s).
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <CustomersAddModal ref="addModal" />

  <CustomersAppointmentsSlideover
    v-model:open="appointmentsOpen"
    :client-id="viewingClient?.id ?? null"
  />

  <CustomersBlockModal
    v-model:open="blockOpen"
    :clients="blockTarget ? [blockTarget] : []"
    :blocked="blockState"
    @changed="refresh"
  />
</template>
