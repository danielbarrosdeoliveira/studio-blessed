import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarDate } from '@internationalized/date'
import AvailabilityPicker from '~/components/AvailabilityPicker.vue'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

mockNuxtImport('$fetch', () => fetchMock)

const slotA = {
  startsAt: '2026-10-29T12:00:00.000Z',
  endsAt: '2026-10-29T12:40:00.000Z',
  label: '09:00'
}

const slotB = {
  startsAt: '2026-10-30T12:15:00.000Z',
  endsAt: '2026-10-30T12:55:00.000Z',
  label: '09:15'
}

function availability(slots: typeof slotA[]) {
  return {
    date: '2026-10-29',
    timezone: 'America/Sao_Paulo',
    origin: 'client' as const,
    slots
  }
}

function mountPicker(overrides: Record<string, unknown> = {}) {
  return mountSuspended(AvailabilityPicker, {
    props: {
      professionalId: 'maria-1',
      serviceId: 'service-1',
      minDate: '2026-10-29',
      ...overrides
    }
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(availability([slotA, slotB]))
})

describe('AvailabilityPicker — estados', () => {
  it('não busca horários sem profissional ou serviço', async () => {
    const wrapper = await mountPicker({ professionalId: '', serviceId: '' })

    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Sem horários nesta data')
  })

  it('exibe a mensagem de erro da API', async () => {
    fetchMock.mockRejectedValueOnce({
      data: { message: 'Serviço indisponível' }
    })

    const wrapper = await mountPicker()
    await flushPromises()

    expect(wrapper.text()).toContain('Serviço indisponível')
  })

  it('usa a data mínima informada quando não há antecedência da cliente', async () => {
    const wrapper = await mountPicker({ clientLead: false })

    await flushPromises()

    const min = (wrapper.vm as unknown as { minCalendarDate: CalendarDate })
      .minCalendarDate

    expect(min.year).toBe(2026)
    expect(min.month).toBe(10)
    expect(min.day).toBe(29)
  })

  it('limpa o slot selecionado quando ele some da nova data', async () => {
    fetchMock
      .mockResolvedValueOnce(availability([slotA]))
      .mockResolvedValueOnce(availability([slotB]))

    const wrapper = await mountPicker()
    await flushPromises()

    const slot = wrapper.findAll('button').find(button => button.text() === '09:00')

    await slot!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([slotA.startsAt])

    ;(wrapper.vm as unknown as { calendarDate: CalendarDate }).calendarDate = new CalendarDate(
      2026,
      10,
      30
    )
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([null])
    expect(fetchMock).toHaveBeenLastCalledWith('/api/public/availability', {
      query: {
        professionalId: 'maria-1',
        serviceId: 'service-1',
        date: '2026-10-30'
      }
    })
  })

  it('recarrega ao trocar profissional ou serviço e limpa a seleção', async () => {
    const wrapper = await mountPicker()
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text() === '09:00')!.trigger('click')

    await wrapper.setProps({ serviceId: 'service-2' })
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/public/availability', {
      query: {
        professionalId: 'maria-1',
        serviceId: 'service-2',
        date: '2026-10-29'
      }
    })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })
})
