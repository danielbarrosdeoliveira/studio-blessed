import type { RecentAppointmentsResponse, RecentClientAppointment } from '~/types/domain'
import { useDocumentVisibility, useIntervalFn, useLocalStorage } from '@vueuse/core'
import { formatInstantLong } from '~/utils/date'

/** Intervalo de verificação de novos agendamentos. */
const POLL_INTERVAL_MS = 30_000
const STORAGE_KEY = 'studio-blessed:last-seen-appointment'
const NOTIFICATION_SOUND = '/sounds/notification.mp3'

interface AppointmentCursor {
  /** `null` quando o baseline foi criado sem nenhum agendamento na janela. */
  id: string | null
  createdAt: string
}

/**
 * Polling leve de novos agendamentos criados por clientes.
 *
 * - Verifica a API a cada 30s, apenas com a aba visível.
 * - Guarda o último agendamento visto no localStorage para não repetir avisos.
 * - Exibe um toast de alta visibilidade e toca um som discreto.
 */
export function useAppointmentsPolling() {
  const toast = useToast()
  const router = useRouter()
  const visibility = useDocumentVisibility()

  const cursor = useLocalStorage<AppointmentCursor | null>(STORAGE_KEY, null)

  const { data, refresh } = useFetch<RecentAppointmentsResponse>('/api/appointments/recent', {
    // O polling só faz sentido no cliente; no SSR não há aba para monitorar.
    server: false,
    immediate: false,
    default: () => ({ appointments: [], serverTime: new Date(0).toISOString() })
  })

  let audio: HTMLAudioElement | null = null
  let polling = false

  function ensureAudio(): HTMLAudioElement {
    if (!audio) {
      audio = new Audio(NOTIFICATION_SOUND)
      audio.preload = 'auto'
      audio.volume = 0.35
    }

    return audio
  }

  /** O navegador bloqueia áudio antes do primeiro gesto; liberamos em silêncio no primeiro clique/tecla. */
  function unlockAudio() {
    const element = ensureAudio()
    const volume = element.volume

    element.volume = 0

    element
      .play()
      .then(() => {
        element.pause()
        element.currentTime = 0
      })
      .catch(() => {
        // Sem permissão de autoplay ainda: tentaremos novamente na próxima notificação.
      })
      .finally(() => {
        element.volume = volume
      })
  }

  function playNotificationSound() {
    const element = ensureAudio()
    element.currentTime = 0

    void element.play().catch(() => {
      // Silencioso: o aviso visual continua funcionando mesmo sem áudio.
    })
  }

  function sortByCreatedAtDesc(appointments: RecentClientAppointment[]) {
    return [...appointments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  function appointmentsAfterCursor(
    appointments: RecentClientAppointment[],
    stored: AppointmentCursor
  ) {
    const sorted = sortByCreatedAtDesc(appointments)
    const cursorIndex = sorted.findIndex((item) => item.id === stored.id)

    // Normalmente o cursor está na janela; tudo acima dele é novo.
    if (cursorIndex >= 0) {
      return sorted.slice(0, cursorIndex)
    }

    // Se o cursor saiu da janela de 24h, comparamos pela data de criação.
    return sorted.filter((item) => item.createdAt > stored.createdAt)
  }

  function notifyNewAppointments(appointments: RecentClientAppointment[]) {
    const newest = appointments[0]

    if (!newest) {
      return
    }

    const count = appointments.length
    const when = formatInstantLong(newest.startsAt)

    toast.add({
      title: count === 1 ? 'Novo Agendamento!' : `${count} novos agendamentos!`,
      description: `${newest.clientName} agendou ${newest.serviceName} para ${when}.`,
      color: 'primary',
      icon: 'i-ri-calendar-check-line',
      duration: 15_000,
      progress: true,
      actions: [
        {
          label: 'Ver agenda',
          color: 'primary',
          variant: 'soft',
          onClick: () => {
            void router.push('/painel')
          }
        }
      ]
    })

    playNotificationSound()
  }

  function processAppointments(response: RecentAppointmentsResponse) {
    const sorted = sortByCreatedAtDesc(response.appointments)
    const newest = sorted[0]
    const stored = cursor.value

    // Primeira execução: memoriza o ponto de partida sem notificar o histórico.
    // Mesmo sem agendamentos, usa o horário do servidor como baseline para que
    // o primeiro agendamento criado depois seja notificado.
    if (!stored) {
      cursor.value = {
        id: newest?.id ?? null,
        createdAt: newest?.createdAt ?? response.serverTime
      }
      return
    }

    if (!newest) {
      return
    }

    const fresh = appointmentsAfterCursor(sorted, stored)

    if (!fresh.length) {
      return
    }

    cursor.value = { id: newest.id, createdAt: newest.createdAt }
    notifyNewAppointments(fresh)
  }

  async function poll() {
    if (polling || visibility.value !== 'visible') {
      return
    }

    polling = true

    try {
      await refresh()
      processAppointments(data.value ?? { appointments: [], serverTime: new Date().toISOString() })
    } catch {
      // Falha de rede pontual: o próximo ciclo tenta novamente.
    } finally {
      polling = false
    }
  }

  const { pause, resume } = useIntervalFn(() => void poll(), POLL_INTERVAL_MS, {
    immediate: false
  })

  function onFirstInteraction() {
    unlockAudio()
    window.removeEventListener('pointerdown', onFirstInteraction)
    window.removeEventListener('keydown', onFirstInteraction)
  }

  onMounted(() => {
    window.addEventListener('pointerdown', onFirstInteraction)
    window.addEventListener('keydown', onFirstInteraction)

    if (visibility.value === 'visible') {
      resume()
      void poll()
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', onFirstInteraction)
    window.removeEventListener('keydown', onFirstInteraction)
    pause()

    if (audio) {
      audio.pause()
      audio.src = ''
      audio = null
    }
  })

  watch(visibility, (state) => {
    if (state === 'visible') {
      resume()
      void poll()
    } else {
      pause()
    }
  })

  return { cursor, poll }
}
