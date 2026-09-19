export function playNotificationSound() {
  try {
    const audioContext = new AudioContext()
    const gain = audioContext.createGain()
    const firstTone = audioContext.createOscillator()
    const secondTone = audioContext.createOscillator()
    const now = audioContext.currentTime

    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch(() => audioContext.close())
    }

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    gain.connect(audioContext.destination)

    firstTone.frequency.setValueAtTime(783.99, now)
    secondTone.frequency.setValueAtTime(1046.5, now + 0.14)
    firstTone.connect(gain)
    secondTone.connect(gain)
    firstTone.start(now)
    firstTone.stop(now + 0.2)
    secondTone.start(now + 0.14)
    secondTone.stop(now + 0.55)

    window.setTimeout(() => {
      if (audioContext.state !== 'closed') void audioContext.close()
    }, 700)
  } catch {
    // Browsers can block audio until the user has interacted with the page.
  }
}
