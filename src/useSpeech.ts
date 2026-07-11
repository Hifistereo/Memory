import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeech(enabled: boolean) {
  const [available, setAvailable] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      voiceRef.current = voices.find((voice) => voice.lang.toLowerCase().startsWith('lv')) ?? null
      setAvailable(Boolean(voiceRef.current))
    }
    pickVoice()
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice)
  }, [])

  const speak = useCallback((text: string) => {
    if (!enabled || !('speechSynthesis' in window)) return false
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'lv-LV'
    utterance.rate = .86
    utterance.pitch = 1.08
    if (voiceRef.current) utterance.voice = voiceRef.current
    window.speechSynthesis.speak(utterance)
    return true
  }, [enabled])

  return { speak, available }
}
