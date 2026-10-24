import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StaffAppointment } from '~/types/domain'
import StaffAppointmentCard from '~/components/StaffAppointmentCard.vue'

const { fetchMock, toastAdd } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  toastAdd: vi.fn()
}))

mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('useToast', () => () => ({ add: toastAdd }))

const appointment: StaffAppointment = {
  id: 'appointment-1',
  startsAt: '2026-10-29T12:00:00.000Z',
  endsAt: '2026-10-29T12:40:00.000Z',
  status: 'scheduled',
  origin: 'staff',
  serviceId: 'service-1',
  professionalId: 'maria-1',
  serviceName: 'Corte feminino',
  professionalName: 'Maria',
  durationMin: 40,
  priceCents: 13000,
  clientName: 'Cliente Teste',
  clientPhone: '11999990000',
  notes: null
}

function buttonByText(wrapper: Awaited<ReturnType<typeof mountSuspended>>, text: string) {
  return wrapper.findAll('button').find(button => button.text() === text)
}

function mountCard(overrides: Partial<StaffAppointment> = {}, props: {
  isAdmin?: boolean
  currentUserId?: string
} = {}) {
  return mountSuspended(StaffAppointmentCard, {
    props: {
      appointment: { ...appointment, ...overrides },
      isAdmin: props.isAdmin ?? false,
      currentUserId: props.currentUserId ?? 'maria-1'
    }
  })
}

function documentButtonByText(text: string) {
  return Array.from(document.querySelectorAll('button'))
    .find(button => button.textContent?.trim() === text)
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({})
  toastAdd.mockReset()
})

describe('StaffAppointmentCard', () => {
  it('oferece concluir, no-show e cancelar para agendamento ativo', async () => {
    const wrapper = await mountCard()

    expect(buttonByText(wrapper, 'Concluir')).toBeDefined()
    expect(buttonByText(wrapper, 'No-show')).toBeDefined()
    expect(buttonByText(wrapper, 'Cancelar')).toBeDefined()
    expect(wrapper.text()).toContain('Agendado')
  })

  it('esconde ações de um agendamento já concluído para a partner', async () => {
    const wrapper = await mountCard({ status: 'completed' })

    expect(buttonByText(wrapper, 'Concluir')).toBeUndefined()
    expect(buttonByText(wrapper, 'Cancelar')).toBeUndefined()
    expect(buttonByText(wrapper, 'Corrigir para no-show')).toBeUndefined()
  })

  it('permite ao admin corrigir um status já marcado', async () => {
    const wrapper = await mountCard({ status: 'completed' }, { isAdmin: true })

    expect(buttonByText(wrapper, 'Corrigir para no-show')).toBeDefined()
  })

  it('envia o PATCH ao concluir e avisa o pai', async () => {
    const wrapper = await mountCard()
    const button = buttonByText(wrapper, 'Concluir')

    await button!.trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/appointments/appointment-1', {
      method: 'PATCH',
      body: { action: 'status', status: 'completed' }
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Atendimento concluído'
    }))
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('mostra o erro quando o status não pode ser atualizado', async () => {
    fetchMock.mockRejectedValueOnce({
      data: { message: 'Agendamento já finalizado' }
    })

    const wrapper = await mountCard()
    await buttonByText(wrapper, 'Concluir')!.trigger('click')
    await flushPromises()

    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Não foi possível atualizar o status',
      description: 'Agendamento já finalizado'
    }))
    expect(wrapper.emitted('changed')).toBeUndefined()
  })

  it('cancela o agendamento após confirmar no modal', async () => {
    const wrapper = await mountCard()

    await buttonByText(wrapper, 'Cancelar')!.trigger('click')
    const confirm = documentButtonByText('Confirmar cancelamento')

    expect(confirm).toBeDefined()
    confirm!.click()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/appointments/appointment-1', {
      method: 'PATCH',
      body: { action: 'cancel' }
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Agendamento cancelado'
    }))
    expect(wrapper.emitted('changed')).toHaveLength(1)
    wrapper.unmount()
  })

  it('mantém o modal aberto e exibe o erro quando o cancelamento falha', async () => {
    fetchMock.mockRejectedValueOnce({
      data: { message: 'Cancelamento bloqueado' }
    })

    const wrapper = await mountCard()
    await buttonByText(wrapper, 'Cancelar')!.trigger('click')
    documentButtonByText('Confirmar cancelamento')!.click()
    await flushPromises()

    expect(document.body.textContent).toContain('Cancelamento bloqueado')
    expect(wrapper.emitted('changed')).toBeUndefined()
    wrapper.unmount()
  })

  it('não oferece ações para agendamento de outra profissional', async () => {
    const wrapper = await mountCard(
      { professionalId: 'ana-1' },
      { currentUserId: 'maria-1' }
    )

    expect(buttonByText(wrapper, 'Concluir')).toBeUndefined()
    expect(buttonByText(wrapper, 'Cancelar')).toBeUndefined()
  })

  it('oferece a correção inversa para um no-show do admin', async () => {
    const wrapper = await mountCard({ status: 'no_show' }, { isAdmin: true })

    expect(buttonByText(wrapper, 'Corrigir para concluído')).toBeDefined()
  })

  it('exibe observações, origem e link do WhatsApp', async () => {
    const wrapper = await mountCard({ origin: 'client', notes: 'Cliente pediu corte curto' })

    expect(wrapper.text()).toContain('Cliente pediu corte curto')
    expect(wrapper.text()).toContain('Cliente')
    expect(wrapper.find('a[href="https://wa.me/5511999990000"]').exists()).toBe(true)
  })
})
