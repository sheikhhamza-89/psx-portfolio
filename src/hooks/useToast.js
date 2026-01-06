import { useState, useCallback } from 'react'

/**
 * Custom hook for managing toast notifications
 */
export function useToast() {
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false })

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, visible: true })

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
    }, 3000)
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  return { toast, showToast, hideToast }
}

