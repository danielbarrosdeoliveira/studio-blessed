<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import { formatPhone } from '~/utils/phone'
import { formatIsoDateLong } from '~/utils/date'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
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
  createdAt: string
}

const { data, status } = await useFetch<Client[]>('/api/clientes', {
  lazy: true
})

function getRowItems(row: Row<Client>) {
  return [
    {
      type: 'label',
      label: 'Ações'
    },
    {
      label: 'Copiar ID da cliente',
      icon: 'i-ri-file-copy-line',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copiado para a área de transferência',
          description: 'ID da cliente copiado para a área de transferência'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Ver agendamentos da cliente',
      icon: 'i-ri-calendar-line'
    },
    {
      type: 'separator'
    },
    {
      label: 'Excluir cliente',
      icon: 'i-ri-delete-bin-line',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Cliente excluída',
          description: 'A cliente foi excluída.'
        })
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
    cell: ({ row }) => h('p', { class: 'font-medium text-highlighted' }, row.original.name)
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
      h('p', { class: 'text-sm text-muted' }, formatIsoDateLong(row.original.createdAt))
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
          <CustomersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Excluir"
              color="error"
              variant="subtle"
              icon="i-ri-delete-bin-line"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </CustomersDeleteModal>

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
</template>
