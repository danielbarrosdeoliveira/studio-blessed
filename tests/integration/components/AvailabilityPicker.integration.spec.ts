import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AvailabilityPicker from '~/components/AvailabilityPicker.vue'

registerEndpoint('/api/public/availability', () => ({
  date: '2026-10-29',
  timezone: 'America/Sao_Paulo',
  origin: 'client',
  slots: [
    {
      startsAt: '2026-10-29T12:00:00.000Z',
      endsAt: '2026-10-29T12:40:00.000Z',
      label: '09:00'
    },
    {
      startsAt: '2026-10-29T12:15:00.000Z',
      endsAt: '2026-10-29T12:55:00.000Z',
      label: '09:15'
    }
  ]
}))

describe('AvailabilityPicker', () => {
  it('carrega os horários e emite o slot selecionado', async () => {
    const wrapper = await mountSuspended(AvailabilityPicker, {
      props: {
        professionalId: 'maria-1',
        serviceId: 'service-1',
        minDate: '2026-10-29'
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('09:00')
    expect(wrapper.text()).toContain('09:15')

    const slot = wrapper.findAll('button').find(button => button.text() === '09:15')

    await slot!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      '2026-10-29T12:15:00.000Z'
    ])
  })
})
