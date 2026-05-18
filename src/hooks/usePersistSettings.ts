import { useState, useEffect } from 'react'
import { loadPreferences, savePreferences, loadTheme, saveTheme } from '../services/dbService'

export function usePersistSettings() {
  const [editMode,        setEditModeRaw]        = useState(false)
  const [refreshInterval, setRefreshIntervalRaw] = useState(30)
  const [theme,           setThemeRaw]           = useState('dark')
  const [notifications,   setNotificationsRaw]   = useState(true)
  const [autoBackup,      setAutoBackupRaw]      = useState(true)
  const [loaded,          setLoaded]             = useState(false)

  // Load from backend on mount
  useEffect(() => {
    Promise.all([loadPreferences(), loadTheme()]).then(([prefs, themeData]) => {
      if (prefs) {
        setEditModeRaw(prefs.editMode        ?? false)
        setRefreshIntervalRaw(prefs.refreshInterval > 1000 ? Math.round(prefs.refreshInterval / 1000) : prefs.refreshInterval ?? 30)
        setNotificationsRaw(prefs.notifications  ?? true)
        setAutoBackupRaw(prefs.autoBackup      ?? true)
      }
      if (themeData) setThemeRaw(themeData.mode ?? 'dark')
      setLoaded(true)
    })
  }, [])

  // Setters that immediately persist to backend
  const setEditMode = (v: boolean) => {
    setEditModeRaw(v)
    savePreferences({ editMode: v, refreshInterval, notifications, autoBackup })
  }
  const setRefreshInterval = (v: number) => {
    setRefreshIntervalRaw(v)
    savePreferences({ editMode, refreshInterval: v, notifications, autoBackup })
  }
  const setNotifications = (v: boolean) => {
    setNotificationsRaw(v)
    savePreferences({ editMode, refreshInterval, notifications: v, autoBackup })
  }
  const setAutoBackup = (v: boolean) => {
    setAutoBackupRaw(v)
    savePreferences({ editMode, refreshInterval, notifications, autoBackup: v })
  }
  const setTheme = (v: string) => {
    setThemeRaw(v)
    saveTheme({ mode: v })
  }

  return {
    loaded,
    editMode,        setEditMode,
    refreshInterval, setRefreshInterval,
    theme,           setTheme,
    notifications,   setNotifications,
    autoBackup,      setAutoBackup,
  }
}
