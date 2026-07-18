// src/hooks/useInstallPrompt.js
import { useState, useEffect, useCallback, useMemo } from 'react'

function detectPlatform() {
  // Guard against SSR / non-browser environments
  if (typeof window === 'undefined') {
    return { isIOS: false, isSafari: false, isAndroid: false }
  }
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  const isAndroid = /Android/.test(ua)
  return { isIOS, isSafari, isAndroid }
}

export function useInstallPrompt() {
  // Compute platform once using useMemo – always returns an object
  const platform = useMemo(() => detectPlatform(), [])
  
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) setInstalled(true)

    // iOS Safari has no beforeinstallprompt API – skip event listeners
    if (platform.isIOS) return

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    const onInstalled = () => {
      setInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [platform.isIOS])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCanInstall(false)
    return choice
  }, [deferredPrompt])

  return { canInstall, installed, promptInstall, platform }
}