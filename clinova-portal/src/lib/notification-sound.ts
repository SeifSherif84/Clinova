const NOTIFICATION_SOUND = '/notification-2.mp3'

export function playNotificationSound() {
  const audio = new Audio(NOTIFICATION_SOUND)
  audio.volume = 0.5
  void audio.play().catch(() => {
    // Browsers can block audio until the user has interacted with the page.
  })
}