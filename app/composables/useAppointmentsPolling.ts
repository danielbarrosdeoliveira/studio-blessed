import type { RecentAppointmentsResponse, RecentClientAppointment } from '~/types/domain'
import { useDocumentVisibility, useIntervalFn, useLocalStorage } from '@vueuse/core'
import { formatInstantLong, isoDateOfInstant } from '~/utils/date'

/** Intervalo de verificação de novos agendamentos. */
const POLL_INTERVAL_MS = 30_000
const STORAGE_KEY = 'studio-blessed:appointment-notifications'
/** Chave antiga (cursor por id), lida apenas para migrar quem já usava o polling. */
const LEGACY_STORAGE_KEY = 'studio-blessed:last-seen-appointment'
const NOTIFICATION_SOUND = '/sounds/notification.mp3'

interface NotificationState {
  /** Criação do agendamento mais recente que já gerou toast/som. */
  notifiedAt: string | null
  /** Horário do servidor da última vez que a dona fechou o sino. */
  seenAt: string | null
}

/**
 * Polling leve de novos agendamentos criados por clientes.
 *
 * - Verifica a API a cada 30s, apenas com a aba visível.
 * - Guarda no localStorage o que já foi avisado (`notifiedAt`) e o que já foi lido (`seenAt`).
 * - Exibe toast + som apenas para agendamentos que chegam com o painel aberto.
 * - Alimenta o sino do painel, que mostra os agendamentos recentes e o contador de não lidos.
 *
 * Deve ser chamado uma única vez (no layout do painel); o sino recebe os dados por props.
 */
export function useAppointmentsPolling() {
  const toast = useToast()
  const router = useRouter()
  const visibility = useDocumentVisibility()

  const state = useLocalStorage<NotificationState | null>(STORAGE_KEY, null)
  const appointments = shallowRef<RecentClientAppointment[]>([])
  const serverTime = ref<string | null>(null)

  const { data, refresh } = useFetch<RecentAppointmentsResponse>('/api/appointments/recent', {
    key: 'appointments-recent',
    // O polling só faz sentido no cliente; no SSR não há aba para monitorar.
    server: false,
    immediate: false,
    default: () => ({ appointments: [], serverTime: new Date(0).toISOString() })
  })

  let audio: HTMLAudioElement | null = null
  let polling = false

  /** Agendamentos ainda não vistos no sino. */
  const unreadAppointments = computed(() => {
    const seenAt = state.value?.seenAt

    if (!seenAt) {
      return appointments.value
    }

    return appointments.value.filter((item) => item.createdAt > seenAt)
  })

  const unreadCount = computed(() => unreadAppointments.value.length)

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

  function sortByCreatedAtDesc(items: RecentClientAppointment[]) {
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /** Lê o cursor antigo do polling para não repetir avisos já feitos antes da migração. */
  function legacyNotifiedAt(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)

      if (!raw) {
        return null
      }

      const parsed = JSON.parse(raw) as { createdAt?: unknown }

      return typeof parsed.createdAt === 'string' ? parsed.createdAt : null
    } catch {
      return null
    }
  }

  function notifyNewAppointments(fresh: RecentClientAppointment[]) {
    const newest = fresh[0]

    if (!newest) {
      return
    }

    const count = fresh.length
    const when = formatInstantLong(newest.startsAt)
    const date = isoDateOfInstant(newest.startsAt)

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
            void router.push(`/painel?date=${date}`)
          }
        }
      ]
    })

    playNotificationSound()
  }

  function processAppointments(response: RecentAppointmentsResponse) {
    appointments.value = sortByCreatedAtDesc(response.appointments)
    serverTime.value = response.serverTime

    const newest = appointments.value[0]
    const current = state.value

    // Primeira execução: memoriza o ponto de partida sem disparar toast retroativo.
    // O sino, porém, mostra todos os agendamentos da janela como não lidos —
    // nada que chegou antes de o painel abrir fica invisível.
    if (!current) {
      state.value = {
        notifiedAt: legacyNotifiedAt() ?? response.serverTime,
        seenAt: null
      }
      return
    }

    if (!newest) {
      return
    }

    if (!current.notifiedAt) {
      state.value = { ...current, notifiedAt: newest.createdAt }
      return
    }

    const notifiedAt = current.notifiedAt
    const fresh = appointments.value.filter((item) => item.createdAt > notifiedAt)

    if (!fresh.length) {
      return
    }

    state.value = { ...current, notifiedAt: newest.createdAt }
    notifyNewAppointments(fresh)
  }

  /** Marca como lidos todos os agendamentos já retornados pela API. */
  function markAllAsRead() {
    const now = serverTime.value ?? new Date().toISOString()
    const current = state.value

    state.value = {
      notifiedAt: current?.notifiedAt ?? now,
      seenAt: now
    }
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

  return {
    appointments: readonly(appointments),
    unreadAppointments,
    unreadCount,
    markAllAsRead,
    refresh: poll
  }
}
