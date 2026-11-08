<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { User } from '~/types'

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([
  {
    id: 'email',
    value: ''
  }
])
const columnVisibility = ref()
const rowSelection = ref({ 1: true })

const { data, status } = await useFetch<User[]>('/api/clientes', {
  lazy: true
})

function getRowItems(row: Row<User>) {
  return [
    {
      type: 'label',
      label: 'Ações'
    },
    {
      label: 'Copiar ID do cliente',
      icon: 'i-ri-file-copy-line',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({
          title: 'Copiado para a área de transferência',
          description: 'ID do cliente copiado para a área de transferência'
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Ver detalhes do cliente',
      icon: 'i-ri-list-unordered'
    },
    {
      label: 'Ver pagamentos do cliente',
      icon: 'i-ri-wallet-line'
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
          title: 'Cliente excluído',
          description: 'O cliente foi excluído.'
        })
      }
    }
  ]
}

const columns: TableColumn<User>[] = [
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
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          ...row.original.avatar,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: '' }, `@${row.original.name}`)
        ])
      ])
    }
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'E-mail',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-ri-sort-asc'
            : 'i-ri-sort-desc'
          : 'i-ri-arrow-up-down-line',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'location',
    header: 'Localização',
    cell: ({ row }) => row.original.location
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const color = {
        subscribed: 'success' as const,
        unsubscribed: 'error' as const,
        bounced: 'warning' as const
      }[row.original.status]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => row.original.status)
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
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
      )
    }
  }
]

const statusFilter = ref('all')

watch(
  () => statusFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return

    const statusColumn = table.value.tableApi.getColumn('status')
    if (!statusColumn) return

    if (newVal === 'all') {
      statusColumn.setFilterValue(undefined)
    } else {
      statusColumn.setFilterValue(newVal)
    }
  }
)

const email = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('email')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('email')?.setFilterValue(value || undefined)
  }
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
          v-model="email"
          class="max-w-sm"
          icon="i-ri-search-line"
          placeholder="Filtrar e-mails..."
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

          <USelect
            v-model="statusFilter"
            :items="[
              { label: 'Todos', value: 'all' },
              { label: 'Inscrito', value: 'subscribed' },
              { label: 'Não inscrito', value: 'unsubscribed' },
              { label: 'Rejeitado', value: 'bounced' }
            ]"
            :ui="{
              trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
            }"
            placeholder="Filtrar status"
            class="min-w-28"
          />
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
</template>
