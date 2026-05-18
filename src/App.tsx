import { useState } from 'react'
import { Header }            from './components/Header'
import { DevicesConditions } from './components/devices/DevicesConditions'
import { Footer }            from './components/Footer'
import { CardCarousel }      from './components/CardCarousel'
import { MediaCard }         from './components/cards/MediaCard'
import { ThermostatCard }    from './components/cards/ThermostatCard'
import { CameraCard }        from './components/cards/CameraCard'
import { AlarmCard }         from './components/cards/AlarmCard'
import { SettingsPanel }     from './components/SettingsPanel'
import ESPHomeDashboard      from './components/esphome/ESPHomeDashboard'
import LiveTVCard    from './components/cards/LiveTVCard'
import { EnergyCard } from './components/cards/EnergyCard'
import FlightCard    from './components/cards/FlightCard'
import SprinklerCard from './components/cards/SprinklerCard'
import CryptoCard    from './components/cards/CryptoCard'
import { usePersistSettings } from './hooks/usePersistSettings'

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--neon-cyan)] whitespace-nowrap">{title}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--neon-cyan)]/60 via-primary/20 to-transparent" />
    </div>
  )
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [espOpen,      setEspOpen]      = useState(false)
  const [activeDevice, setActiveDevice] = useState<unknown>(null)

  const {
    editMode, setEditMode,
    refreshInterval, setRefreshInterval,
    theme, setTheme,
    notifications, setNotifications,
    autoBackup, setAutoBackup,
  } = usePersistSettings()

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col gap-[0.4vh] p-[0.5vh_0.8vw]">

      <Header
        onSettingsOpen={() => setSettingsOpen(true)}
        onESPHomeOpen={()  => setEspOpen(true)}
      />

      <SectionDivider title="Devices & Conditions" />
      <DevicesConditions />

      <SectionDivider title="Featured Controls" />
      <section className="flex-1 flex flex-col min-h-0">
        <CardCarousel>
          {[
            <MediaCard      key="media"  />,
            <ThermostatCard key="thermo" />,
            <CameraCard     key="camera" />,
            <AlarmCard      key="alarm"  />,
            <LiveTVCard     key="livetv" />,
            <EnergyCard     key="energy" />,
            <FlightCard     key="flight" />,
            <SprinklerCard  key="sprinkler" />,
            <CryptoCard     key="crypto" />,
          ]}
        </CardCarousel>
      </section>

      <SectionDivider title="System Status" />
      <Footer editMode={editMode} />

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          editMode={editMode}
          onEditModeChange={setEditMode}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
          theme={theme}
          onThemeChange={setTheme}
          notifications={notifications}
          onNotificationsChange={setNotifications}
          autoBackup={autoBackup}
          onAutoBackupChange={setAutoBackup}
        />
      )}

      {espOpen && (
        <div className="fixed inset-0 z-[9998]">
          <ESPHomeDashboard
            activeDevice={activeDevice}
            onOpenDevice={(device: unknown) => setActiveDevice(device)}
            onBack={() => {
              if (activeDevice) setActiveDevice(null)
              else setEspOpen(false)
            }}
          />
        </div>
      )}
    </main>
  )
}
