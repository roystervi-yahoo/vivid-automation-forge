import { DoorOpen, Droplets, Shirt, Wind, Flame, Bot } from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { DeviceTile } from './DeviceTile'

export function DevicesList() {
  const { getState } = useHA()

  const denWindow = getState('binary_sensor.den_single_window')
  const recirc    = getState('switch.recirculation_pump')
  const washer    = getState('sensor.washer_machine_state')
  const dryer     = getState('sensor.dryer_machine_state')
  const hotWater  = getState('sensor.hot_water_tank_power_minute_average')
  const purifier1 = getState('fan.air_purifier_living')
  const purifier2 = getState('fan.air_purifier_master')
  const vacuum    = getState('vacuum.l10s_vacuum')

  const devices = [
    { id:'den',       name:'Den',           sub:'Window',  status: denWindow?.state==='on'?'open':'off',                      icon:DoorOpen, accent:'amber'  as const },
    { id:'recirc',    name:'Recirc Pump',                  status: recirc?.state==='on'?'on':'off',                           icon:Droplets, accent:'cyan'   as const },
    { id:'washer',    name:'Washer',                       status: (washer?.state||'off').toLowerCase()   as any,             icon:Shirt                              },
    { id:'dryer',     name:'Dryer',                        status: (dryer?.state||'offline').toLowerCase() as any,            icon:Wind                               },
    { id:'hotwater',  name:'Hot Water',                    status: hotWater?(parseFloat(hotWater.state)>50?'on':'off'):'offline' as any, icon:Flame              },
    { id:'purifier1', name:'Air Purifier',  sub:'Living',  status: purifier1?.state==='on'?'on':'off',                        icon:Wind                               },
    { id:'purifier2', name:'Air Purifier',  sub:'Master',  status: purifier2?.state==='on'?'on':'off',                        icon:Wind                               },
    { id:'vacuum',    name:'L10S Vacuum',                  status: vacuum?.state==='cleaning'?'on':'off',                     icon:Bot,      accent:'lime'   as const },
  ]

  return (
    <div className="grid grid-cols-8 gap-2">
      {devices.map(d => <DeviceTile key={d.id} d={d as any} />)}
    </div>
  )
}
