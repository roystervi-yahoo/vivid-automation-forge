import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { loadPortfolio, savePortfolio } from '../../services/dbService'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

const DEFAULT_COINS = [
  { id:'jasmycoin',        name:'Jasmy',    symbol:'JASMY', color:'#00ffff', icon:'https://assets.coingecko.com/coins/images/13876/small/JASMY200.jpg' },
  { id:'shiba-inu',        name:'Shiba',    symbol:'SHIB',  color:'#ff8800', icon:'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  { id:'dogecoin',         name:'Doge',     symbol:'DOGE',  color:'#ffcc00', icon:'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { id:'crypto-com-chain', name:'Cronos',   symbol:'CRO',   color:'#3b82f6', icon:'https://assets.coingecko.com/coins/images/7310/small/cro_token_logo.png' },
  { id:'algorand',         name:'Algo',     symbol:'ALGO',  color:'#44ffaa', icon:'https://assets.coingecko.com/coins/images/4380/small/download.png' },
  { id:'dogelon-mars',     name:'Dogelon',  symbol:'ELON',  color:'#ff44ff', icon:'https://assets.coingecko.com/coins/images/14962/small/6GxcPRo3_400x400.jpg' },
  { id:'ripple',           name:'XRP',      symbol:'XRP',   color:'#22d3ee', icon:'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { id:'spell-token',      name:'Spell',    symbol:'SPELL', color:'#a855f7', icon:'https://assets.coingecko.com/coins/images/15861/small/abracadabra-3.png' },
]

const COIN_COLORS = ['#00ffff','#ff8800','#ffcc00','#3b82f6','#44ffaa','#ff44ff','#22d3ee','#a855f7','#ff4444','#44ff88','#ffaa44','#ff6699']

const DEFAULT_ASSETS = { property:0, iras:[{id:1,name:'IRA 1',value:0}], cash:0, cars:18900 }
const DEFAULT_ASSET_META = {
  cars:     { lastUpdated:null, note:'2021 Infiniti Q50 Luxe' },
  property: { lastUpdated:null, address:'2336 Fiesta Lane, Jacksonville FL 32277' },
  cash:     { lastUpdated:null, note:'' },
}
const ASSET_LABELS: Record<string,string> = { property:'🏠 Property', cash:'💵 Cash', cars:'🚗 Cars' }

function formatPrice(price: number) {
  if (!price) return '--'
  if (price < 0.000001) return price.toFixed(10)
  if (price < 0.001)    return price.toFixed(8)
  if (price < 1)        return price.toFixed(6)
  return price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:4})
}

function formatChange(change: number) {
  if (change === undefined) return null
  const up = change >= 0
  return { up, text:`${up?'+':''}${change.toFixed(2)}%` }
}

export default function CryptoCard() {
  const [coins,       setCoins]       = useState(DEFAULT_COINS)
  const [prices,      setPrices]      = useState<any>({})
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null)
  const [showFull,    setShowFull]    = useState(false)
  const [holdings,    setHoldings]    = useState<any>({})
  const [assets,      setAssets]      = useState(DEFAULT_ASSETS)
  const [assetMeta,   setAssetMeta]   = useState(DEFAULT_ASSET_META)

  useEffect(() => {
    loadPortfolio().then((d:any) => {
      if (d?.coins)     setCoins(d.coins)
      if (d?.holdings)  setHoldings(d.holdings)
      if (d?.assets)    setAssets({...DEFAULT_ASSETS,...d.assets})
      if (d?.assetMeta) setAssetMeta({...DEFAULT_ASSET_META,...d.assetMeta})
    })
  }, [])

  const fetchPrices = useCallback(async (coinList?: typeof DEFAULT_COINS) => {
    const list = coinList || coins
    try {
      const ids = list.map(c=>c.id).join(',')
      const res = await fetch(`${API_BASE}/api/crypto/prices?ids=${ids}`)
      if (!res.ok) throw new Error('API error')
      setPrices(await res.json())
      setLastUpdated(new Date())
      setError(false)
      setLoading(false)
    } catch { setError(true); setLoading(false) }
  }, [coins])

  useEffect(() => {
    fetchPrices()
    const t = setInterval(fetchPrices, 60000)
    return () => clearInterval(t)
  }, [fetchPrices])

  const totalValue = coins.reduce((s,c) => s + ((prices[c.id]?.usd||0)*(holdings[c.id]||0)), 0)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',
      background:'linear-gradient(135deg,rgba(10,20,45,0.98),rgba(15,30,65,0.98))',
      border:'2px solid rgba(0,200,255,0.3)',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
      borderRadius:16,overflow:'hidden',padding:0}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        padding:'12px 16px',background:'rgba(0,200,255,0.05)',
        borderBottom:'1px solid rgba(0,200,255,0.1)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div onClick={()=>setShowFull(true)} style={{width:32,height:32,borderRadius:10,cursor:'pointer',
            background:'rgba(0,200,255,0.1)',border:'1px solid rgba(0,200,255,0.3)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>₿</div>
          <div>
            <div style={{fontSize:13,fontWeight:900,color:'#fff',textTransform:'uppercase',letterSpacing:1}}>Crypto</div>
            <div style={{fontSize:9,color:'rgba(0,200,255,0.5)',textTransform:'uppercase',letterSpacing:2}}>Live Market</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {totalValue > 0 && <div style={{fontSize:11,fontWeight:900,color:'#44ff88',fontFamily:'Courier New'}}>${totalValue.toLocaleString('en-US',{maximumFractionDigits:2})}</div>}
          <button onClick={()=>fetchPrices()} style={{background:'rgba(0,200,255,0.08)',border:'1px solid rgba(0,200,255,0.2)',borderRadius:8,padding:6,cursor:'pointer',color:'rgba(0,200,255,0.7)',fontSize:14}}>🔄</button>
        </div>
      </div>

      {/* Coin list */}
      <div style={{flex:1,overflowY:'auto',padding:8,scrollbarWidth:'none'}}>
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'rgba(0,200,255,0.4)',fontSize:12,letterSpacing:2}}>⏳ LOADING...</div>
        ) : error ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:8}}>
            <div style={{fontSize:24}}>📡</div>
            <div style={{color:'rgba(255,100,50,0.7)',fontSize:11,textTransform:'uppercase'}}>API Unavailable</div>
            <button onClick={()=>fetchPrices()} style={{padding:'6px 14px',background:'rgba(0,200,255,0.1)',border:'1px solid rgba(0,200,255,0.3)',color:'#00ffff',borderRadius:8,cursor:'pointer',fontSize:11}}>Retry</button>
          </div>
        ) : coins.map(coin => {
          const data  = prices[coin.id]
          const price = data?.usd
          const chg   = formatChange(data?.usd_24h_change)
          const held  = holdings[coin.id] || 0
          const val   = held * (price||0)
          return (
            <div key={coin.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'7px 10px',marginBottom:3,borderRadius:10,
              background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,
                  background:`${coin.color}18`,border:`1px solid ${coin.color}44`,
                  display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                  {coin.icon
                    ? <img src={coin.icon} alt={coin.symbol} style={{width:26,height:26,borderRadius:'50%'}} onError={e=>(e.currentTarget.style.display='none')}/>
                    : <span style={{fontSize:9,fontWeight:900,color:coin.color}}>{coin.symbol.slice(0,3)}</span>}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:900,color:'#fff'}}>{coin.name}</div>
                  {held > 0 && <div style={{fontSize:8,color:'#44ff88'}}>${val.toLocaleString('en-US',{maximumFractionDigits:2})}</div>}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,fontFamily:'Courier New',fontWeight:700,color:'#fff'}}>${formatPrice(price)}</div>
                {chg && <div style={{fontSize:9,fontWeight:900,color:chg.up?'#44ff88':'#ff4444',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:2}}>
                  {chg.up?'▲':'▼'} {chg.text}
                </div>}
              </div>
            </div>
          )
        })}
      </div>

      {lastUpdated && (
        <div style={{padding:'5px 16px',fontSize:9,color:'rgba(0,200,255,0.3)',textAlign:'center',borderTop:'1px solid rgba(0,200,255,0.08)',flexShrink:0}}>
          Updated {lastUpdated.toLocaleTimeString()} · CoinGecko
        </div>
      )}

      {showFull && createPortal(
        <PortfolioPopup
          onClose={()=>setShowFull(false)}
          coins={coins} setCoins={setCoins}
          prices={prices} holdings={holdings} setHoldings={setHoldings}
          assets={assets} setAssets={setAssets}
          assetMeta={assetMeta} setAssetMeta={setAssetMeta}
          fetchPrices={fetchPrices}
        />,
        document.body
      )}
    </div>
  )
}

function AddCoinPanel({ onAdd, onClose }: any) {
  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [holdings,  setHoldings]  = useState('')
  const [selected,  setSelected]  = useState<any>(null)
  const [err,       setErr]       = useState('')

  const searchCoin = async () => {
    if (!search.trim()) return
    setSearching(true); setErr('')
    try {
      const r = await fetch(`${API_BASE}/api/crypto/search?q=${encodeURIComponent(search.trim())}`)
      const data = await r.json()
      setResults(data.coins?.slice(0,8)||[])
      if (!data.coins?.length) setErr('No coins found')
    } catch { setErr('Search failed') }
    setSearching(false)
  }

  return createPortal(
    <div style={{position:'fixed',inset:0,zIndex:999999,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Courier New'}}>
      <div style={{width:480,background:'linear-gradient(135deg,rgba(10,20,45,0.99),rgba(15,30,65,0.99))',border:'1px solid rgba(0,200,255,0.3)',borderRadius:20,padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:900,color:'#fff',textTransform:'uppercase',letterSpacing:1}}>⬡ Add Crypto</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:20}}>✕</button>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Search by name (e.g. "Bitcoin", "Solana")</div>
          <div style={{display:'flex',gap:8}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchCoin()}
              placeholder="Enter crypto name..."
              style={{flex:1,padding:'10px 14px',borderRadius:10,background:'rgba(0,200,255,0.08)',border:'1px solid rgba(0,200,255,0.3)',color:'#fff',fontSize:13,fontFamily:'Courier New',outline:'none'}}/>
            <button onClick={searchCoin} style={{padding:'10px 16px',borderRadius:10,background:'rgba(0,200,255,0.15)',border:'1px solid rgba(0,200,255,0.4)',color:'#00ffff',cursor:'pointer',fontSize:13,fontWeight:900}}>
              {searching?'...':'Search'}
            </button>
          </div>
          {err && <div style={{fontSize:10,color:'#ff4444',marginTop:6}}>{err}</div>}
        </div>
        {results.length > 0 && (
          <div style={{marginBottom:16,maxHeight:200,overflowY:'auto'}}>
            {results.map(coin=>(
              <div key={coin.id} onClick={()=>setSelected(coin)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:10,cursor:'pointer',marginBottom:4,
                  background:selected?.id===coin.id?'rgba(0,200,255,0.15)':'rgba(255,255,255,0.03)',
                  border:`1px solid ${selected?.id===coin.id?'rgba(0,200,255,0.5)':'rgba(255,255,255,0.06)'}`,transition:'all 0.15s'}}>
                {coin.thumb && <img src={coin.thumb} alt={coin.symbol} style={{width:24,height:24,borderRadius:'50%'}}/>}
                <div>
                  <div style={{fontSize:12,fontWeight:900,color:'#fff'}}>{coin.name}</div>
                  <div style={{fontSize:9,color:'#555'}}>{coin.symbol.toUpperCase()} · #{coin.market_cap_rank||'--'}</div>
                </div>
                {selected?.id===coin.id && <div style={{marginLeft:'auto',color:'#00ffff',fontSize:16}}>✓</div>}
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Holdings for {selected.name}</div>
            <input type="number" value={holdings} onChange={e=>setHoldings(e.target.value)}
              placeholder={`How many ${selected.symbol.toUpperCase()} do you own?`}
              style={{width:'100%',padding:'10px 14px',borderRadius:10,background:'rgba(0,200,255,0.08)',border:'1px solid rgba(0,200,255,0.3)',color:'#00ffff',fontSize:14,fontFamily:'Courier New',outline:'none',boxSizing:'border-box'}}/>
          </div>
        )}
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#555',cursor:'pointer',fontSize:12,fontWeight:900}}>Cancel</button>
          <button onClick={()=>{ if(!selected) return; onAdd({id:selected.id,name:selected.name,symbol:selected.symbol.toUpperCase(),color:COIN_COLORS[Math.floor(Math.random()*COIN_COLORS.length)],icon:selected.thumb||''},parseFloat(holdings)||0); onClose() }}
            disabled={!selected}
            style={{flex:2,padding:10,borderRadius:10,background:selected?'rgba(0,200,255,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${selected?'rgba(0,200,255,0.4)':'rgba(255,255,255,0.1)'}`,color:selected?'#00ffff':'#555',cursor:selected?'pointer':'not-allowed',fontSize:12,fontWeight:900}}>
            {selected?`✓ Add ${selected.name}`:'Select a coin first'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PortfolioPopup({ onClose, coins, setCoins, prices, holdings, setHoldings, assets, setAssets, assetMeta, setAssetMeta, fetchPrices }: any) {
  const [tab,        setTab]        = useState('portfolio')
  const [editing,    setEditing]    = useState(false)
  const [editHold,   setEditHold]   = useState({...holdings})
  const [editAssets, setEditAssets] = useState({...assets})
  const [editMeta,   setEditMeta]   = useState({...assetMeta})
  const [chartCoin,  setChartCoin]  = useState(coins[6]||coins[0])
  const [chartRange, setChartRange] = useState('30')
  const [chartData,  setChartData]  = useState<any>(null)
  const [chartLoading,setChartLoading] = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [showAdd,    setShowAdd]    = useState(false)

  const fetchChart = useCallback(async (coinId: string, days: string) => {
    setChartLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/crypto/chart?id=${coinId}&days=${days}`)
      const data = await r.json()
      setChartData(data.prices||[])
    } catch { setChartData(null) }
    setChartLoading(false)
  }, [])

  useEffect(() => { if (tab==='charts') fetchChart(chartCoin.id, chartRange) }, [tab, chartCoin, chartRange, fetchChart])

  const saveAll = async () => {
    setHoldings({...editHold}); setAssets({...editAssets}); setAssetMeta({...editMeta})
    await savePortfolio({ coins, holdings:editHold, assets:editAssets, assetMeta:editMeta })
    setEditing(false); setSaved(true); setTimeout(()=>setSaved(false), 2000)
  }

  const handleAddCoin = async (coin: any, amt: number) => {
    const newCoins = [...coins, coin]
    const newHoldings = {...holdings, [coin.id]:amt}
    setCoins(newCoins); setHoldings(newHoldings); setEditHold(newHoldings)
    await savePortfolio({ coins:newCoins, holdings:newHoldings, assets, assetMeta })
    fetchPrices(newCoins)
  }

  const removeCoin = async (coinId: string) => {
    const newCoins = coins.filter((c:any)=>c.id!==coinId)
    const newH = {...holdings}; delete newH[coinId]
    setCoins(newCoins); setHoldings(newH); setEditHold(newH)
    await savePortfolio({ coins:newCoins, holdings:newH, assets, assetMeta })
  }

  const totalCrypto = coins.reduce((s:number,c:any)=>s+((prices[c.id]?.usd||0)*(holdings[c.id]||0)),0)
  const irasTotal   = (assets.iras||[]).reduce((s:number,i:any)=>s+(parseFloat(i.value)||0),0)
  const totalAssets = (parseFloat(assets.property)||0)+irasTotal+(parseFloat(assets.cash)||0)+(parseFloat(assets.cars)||0)
  const netWorth    = totalCrypto + totalAssets

  const C = { card:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)', cyan:'#00ffff', green:'#44ff88', red:'#ff4444', amber:'#ffaa44' }

  const RANGES = [{l:'1D',v:'1'},{l:'7D',v:'7'},{l:'1M',v:'30'},{l:'3M',v:'90'},{l:'1Y',v:'365'},{l:'3Y',v:'1095'},{l:'5Y',v:'1825'},{l:'Max',v:'max'}]

  const renderChart = () => {
    if (chartLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'rgba(0,200,255,0.4)',fontSize:12}}>⏳ Loading...</div>
    if (!chartData||chartData.length<2) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#555',fontSize:12}}>No data</div>
    const p2=chartData.map((d:any)=>d[1])
    const min=Math.min(...p2),max=Math.max(...p2),range=max-min||1
    const W=600,H=200
    const pts=p2.map((p:number,i:number)=>`${(i/(p2.length-1))*W},${H-((p-min)/range)*(H-20)-10}`).join(' ')
    const isUp=p2[p2.length-1]>=p2[0]
    const c=isUp?'#44ff88':'#ff4444'
    const pct=((p2[p2.length-1]-p2[0])/p2[0]*100).toFixed(2)
    return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:20,fontWeight:900,color:'#fff',fontFamily:'Courier New'}}>${formatPrice(p2[p2.length-1])}</div>
          <div style={{fontSize:14,fontWeight:900,color:isUp?'#44ff88':'#ff4444'}}>{isUp?'▲':'▼'} {Math.abs(Number(pct))}%</div>
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
          <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.3"/><stop offset="100%" stopColor={c} stopOpacity="0"/></linearGradient></defs>
          <polyline points={`${pts} ${W},${H} 0,${H}`} fill="url(#cg)" stroke="none"/>
          <polyline points={pts} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </div>
    )
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:99999,background:'linear-gradient(135deg,rgba(5,10,25,0.99),rgba(10,18,45,0.99))',display:'flex',flexDirection:'column',fontFamily:'Courier New,monospace',color:'#fff'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 24px',background:'rgba(0,0,0,0.4)',borderBottom:'1px solid rgba(0,200,255,0.12)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{fontSize:28}}>₿</div>
          <div>
            <div style={{fontSize:20,fontWeight:900,color:'#fff',letterSpacing:2,textTransform:'uppercase'}}>PORTFOLIO <span style={{color:C.cyan,fontWeight:400}}>PRO</span></div>
            <div style={{fontSize:9,color:'#555',letterSpacing:3,textTransform:'uppercase'}}>Wealth Intelligence Dashboard</div>
          </div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:9,color:'#555',textTransform:'uppercase',letterSpacing:2,marginBottom:2}}>Net Worth</div>
          <div style={{fontSize:24,fontWeight:900,color:C.green,fontFamily:'Courier New'}}>${netWorth.toLocaleString('en-US',{maximumFractionDigits:0})}</div>
        </div>
        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',padding:4,borderRadius:12,border:'1px solid rgba(255,255,255,0.08)'}}>
          {['portfolio','charts','assets'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'6px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:1,background:tab===t?'rgba(255,255,255,0.1)':'transparent',color:tab===t?'#fff':'#555',transition:'all 0.2s',fontFamily:'inherit'}}>{t}</button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>setShowAdd(true)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(0,200,255,0.4)',cursor:'pointer',background:'rgba(0,200,255,0.1)',color:C.cyan,fontSize:10,fontWeight:900}}>⬡ Add Crypto</button>
          <button onClick={()=>{ setEditing(!editing); setEditHold({...holdings}); setEditAssets({...assets}); setEditMeta({...assetMeta}) }}
            style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${editing?C.amber+'66':'rgba(255,255,255,0.1)'}`,cursor:'pointer',background:editing?`${C.amber}22`:'rgba(255,255,255,0.04)',color:editing?C.amber:'#888',fontSize:10,fontWeight:900}}>
            {editing?'✏️ Editing':'✏️ Edit'}
          </button>
          {editing && <button onClick={saveAll} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${C.green}66`,cursor:'pointer',background:`${C.green}22`,color:saved?C.green:'#fff',fontSize:10,fontWeight:900}}>{saved?'✓ Saved':'💾 Save'}</button>}
          <button onClick={onClose} style={{width:36,height:36,borderRadius:10,cursor:'pointer',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:'auto',padding:'20px 24px'}}>

        {tab==='portfolio' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Crypto holdings */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:1}}>₿ Crypto Holdings</div>
                <div style={{fontSize:13,fontWeight:900,color:C.green,fontFamily:'Courier New'}}>${totalCrypto.toLocaleString('en-US',{maximumFractionDigits:2})}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                {coins.map((coin:any)=>{
                  const price = prices[coin.id]?.usd||0
                  const chg   = formatChange(prices[coin.id]?.usd_24h_change)
                  const held  = editing?(editHold[coin.id]||0):(holdings[coin.id]||0)
                  const val   = held*price
                  return (
                    <div key={coin.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:10,
                      background:held>0?`${coin.color}0a`:'rgba(255,255,255,0.02)',border:`1px solid ${held>0?coin.color+'22':'rgba(255,255,255,0.05)'}`}}>
                      <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,background:`${coin.color}18`,border:`1px solid ${coin.color}44`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {coin.icon?<img src={coin.icon} alt={coin.symbol} style={{width:26,height:26,borderRadius:'50%'}} onError={e=>(e.currentTarget.style.display='none')}/>
                          :<span style={{fontSize:9,fontWeight:900,color:coin.color}}>{coin.symbol.slice(0,3)}</span>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:11,fontWeight:900}}>{coin.name}</span>
                          <span style={{fontSize:11,fontFamily:'Courier New',color:held>0?C.green:'#555'}}>{held>0?`$${val.toLocaleString('en-US',{maximumFractionDigits:2})}`:'--'}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:2}}>
                          {editing?(
                            <input type="number" value={editHold[coin.id]||''} onChange={e=>setEditHold((p:any)=>({...p,[coin.id]:parseFloat(e.target.value)||0}))}
                              placeholder="0 holdings"
                              style={{width:110,padding:'2px 6px',borderRadius:6,background:'rgba(0,200,255,0.08)',border:'1px solid rgba(0,200,255,0.3)',color:C.cyan,fontSize:11,fontFamily:'Courier New',outline:'none'}}/>
                          ):(
                            <span style={{fontSize:9,color:'#555'}}>{held>0?`${held.toLocaleString()} ${coin.symbol}`:'No holdings'}</span>
                          )}
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{fontSize:9,color:'#555'}}>${formatPrice(price)}</span>
                            {chg&&<span style={{fontSize:9,fontWeight:900,color:chg.up?'#44ff88':'#ff4444'}}>{chg.up?'▲':'▼'}{chg.text}</span>}
                            {editing&&<button onClick={()=>removeCoin(coin.id)} style={{padding:'1px 5px',borderRadius:4,border:'1px solid rgba(255,68,68,0.3)',cursor:'pointer',background:'rgba(255,68,68,0.1)',color:'#ff4444',fontSize:9}}>✕</button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <button onClick={()=>setShowAdd(true)} style={{marginTop:6,padding:8,borderRadius:10,border:'1px dashed rgba(0,200,255,0.3)',cursor:'pointer',background:'rgba(0,200,255,0.04)',color:'rgba(0,200,255,0.6)',fontSize:11,fontWeight:900,textAlign:'center'}}>
                  ⬡ Add New Crypto
                </button>
              </div>
            </div>

            {/* Other assets + breakdown */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:1}}>🏦 Other Assets</div>
                  <div style={{fontSize:13,fontWeight:900,color:C.cyan,fontFamily:'Courier New'}}>${totalAssets.toLocaleString('en-US',{maximumFractionDigits:0})}</div>
                </div>
                {Object.entries(ASSET_LABELS).map(([key,label])=>{
                  const val = editing?editAssets[key]||0:assets[key]||0
                  return (
                    <div key={key} style={{padding:'8px 12px',borderRadius:10,marginBottom:6,background:val>0?'rgba(0,200,255,0.05)':'rgba(255,255,255,0.02)',border:`1px solid ${val>0?'rgba(0,200,255,0.2)':'rgba(255,255,255,0.05)'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:12}}>{label}</span>
                        {editing?(
                          <input type="number" value={editing?editAssets[key]||'':val} onChange={e=>{setEditAssets((p:any)=>({...p,[key]:parseFloat(e.target.value)||0}));setEditMeta((p:any)=>({...p,[key]:{...p[key],lastUpdated:new Date().toISOString()}}))}}
                            placeholder="0" style={{width:110,padding:'3px 8px',borderRadius:8,textAlign:'right',background:'rgba(0,200,255,0.08)',border:'1px solid rgba(0,200,255,0.3)',color:C.cyan,fontSize:12,fontFamily:'Courier New',outline:'none'}}/>
                        ):(
                          <span style={{fontSize:12,fontWeight:900,color:val>0?C.cyan:'#555',fontFamily:'Courier New'}}>{val>0?`$${parseFloat(String(val)).toLocaleString('en-US',{maximumFractionDigits:0})}`:' --'}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Breakdown */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18}}>
                <div style={{fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>📊 Breakdown</div>
                {[
                  {label:'₿ Crypto',    val:totalCrypto,          color:C.cyan},
                  {label:'🏠 Property', val:assets.property||0,  color:'#ff8800'},
                  {label:'📈 IRAs',     val:irasTotal,            color:'#44ffaa'},
                  {label:'💵 Cash',     val:assets.cash||0,      color:C.green},
                  {label:'🚗 Cars',     val:assets.cars||0,      color:'#ff44ff'},
                ].map((item,i)=>{
                  const pct = netWorth>0?(item.val/netWorth*100):0
                  return (
                    <div key={i} style={{marginBottom:8}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{fontSize:10,color:'#aaa'}}>{item.label}</span>
                        <span style={{fontSize:10,color:item.color,fontFamily:'Courier New',fontWeight:900}}>${item.val.toLocaleString('en-US',{maximumFractionDigits:0})} <span style={{color:'#555'}}>({pct.toFixed(1)}%)</span></span>
                      </div>
                      <div style={{height:3,background:'rgba(255,255,255,0.05)',borderRadius:2}}>
                        <div style={{height:'100%',width:`${pct}%`,background:item.color,borderRadius:2,transition:'width 0.5s'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tab==='charts' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {coins.map((coin:any)=>(
                <button key={coin.id} onClick={()=>setChartCoin(coin)}
                  style={{padding:'6px 14px',borderRadius:10,border:`1px solid ${chartCoin.id===coin.id?coin.color:coin.color+'33'}`,cursor:'pointer',fontSize:11,fontWeight:900,
                    background:chartCoin.id===coin.id?`${coin.color}22`:'rgba(255,255,255,0.03)',
                    color:chartCoin.id===coin.id?coin.color:'#555',transition:'all 0.15s'}}>{coin.symbol}</button>
              ))}
            </div>
            <div style={{display:'flex',gap:6}}>
              {RANGES.map(r=>(
                <button key={r.v} onClick={()=>setChartRange(r.v)}
                  style={{padding:'5px 12px',borderRadius:8,border:`1px solid ${chartRange===r.v?'rgba(0,200,255,0.5)':'rgba(255,255,255,0.08)'}`,cursor:'pointer',fontSize:10,fontWeight:900,
                    background:chartRange===r.v?'rgba(0,200,255,0.12)':'rgba(255,255,255,0.02)',
                    color:chartRange===r.v?C.cyan:'#555',transition:'all 0.15s'}}>{r.l}</button>
              ))}
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:40,height:40,borderRadius:'50%',overflow:'hidden',background:`${chartCoin.color}18`,border:`1px solid ${chartCoin.color}44`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {chartCoin.icon?<img src={chartCoin.icon} alt={chartCoin.symbol} style={{width:34,height:34,borderRadius:'50%'}} onError={e=>(e.currentTarget.style.display='none')}/>
                      :<span style={{fontSize:12,fontWeight:900,color:chartCoin.color}}>{chartCoin.symbol.slice(0,3)}</span>}
                  </div>
                  <div>
                    <div style={{fontSize:15,fontWeight:900}}>{chartCoin.name}</div>
                    <div style={{fontSize:9,color:'#555'}}>{chartCoin.symbol}/USD</div>
                  </div>
                </div>
                {(holdings[chartCoin.id]||0) > 0 && (
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:9,color:'#555',textTransform:'uppercase',letterSpacing:1}}>Your Holdings</div>
                    <div style={{fontSize:14,fontWeight:900,color:C.green,fontFamily:'Courier New'}}>${((prices[chartCoin.id]?.usd||0)*(holdings[chartCoin.id]||0)).toLocaleString('en-US',{maximumFractionDigits:2})}</div>
                    <div style={{fontSize:9,color:'#555'}}>{holdings[chartCoin.id]} {chartCoin.symbol}</div>
                  </div>
                )}
              </div>
              {renderChart()}
            </div>
          </div>
        )}

        {tab==='assets' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            {Object.entries(ASSET_LABELS).map(([key,label])=>{
              const val = assets[key]||0
              const pct = netWorth>0?(val/netWorth*100):0
              return (
                <div key={key} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                  <div style={{fontSize:24,marginBottom:8}}>{label.split(' ')[0]}</div>
                  <div style={{fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>{label.split(' ').slice(1).join(' ')}</div>
                  {editing?(
                    <input type="number" value={editAssets[key]||''} onChange={e=>{setEditAssets((p:any)=>({...p,[key]:parseFloat(e.target.value)||0}));setEditMeta((p:any)=>({...p,[key]:{...p[key],lastUpdated:new Date().toISOString()}}))}}
                      placeholder="Enter value"
                      style={{width:'100%',padding:'10px 14px',borderRadius:10,boxSizing:'border-box' as const,background:'rgba(0,200,255,0.08)',border:'1px solid rgba(0,200,255,0.3)',color:C.cyan,fontSize:16,fontFamily:'Courier New',outline:'none'}}/>
                  ):(
                    <div style={{fontSize:28,fontWeight:900,color:val>0?C.cyan:'#444',fontFamily:'Courier New',marginBottom:10}}>
                      {val>0?`$${parseFloat(String(val)).toLocaleString('en-US',{maximumFractionDigits:0})}`:'--'}
                    </div>
                  )}
                  <div style={{marginTop:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:9,color:'#555',textTransform:'uppercase',letterSpacing:1}}>% of Net Worth</span>
                      <span style={{fontSize:9,color:C.cyan}}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{height:4,background:'rgba(255,255,255,0.05)',borderRadius:2}}>
                      <div style={{height:'100%',width:`${pct}%`,background:C.cyan,borderRadius:2,transition:'width 0.5s'}}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 24px',background:'rgba(0,0,0,0.4)',borderTop:'1px solid rgba(255,255,255,0.04)',flexShrink:0}}>
        <div style={{fontSize:9,color:'#555'}}>Prices via CoinGecko · Updates every 60s · {coins.length} coins tracked</div>
        <button onClick={fetchPrices} style={{padding:'4px 12px',borderRadius:8,border:'1px solid rgba(0,200,255,0.3)',cursor:'pointer',background:'rgba(0,200,255,0.08)',color:C.cyan,fontSize:9,fontWeight:900}}>🔄 Refresh</button>
      </div>

      {showAdd && <AddCoinPanel onAdd={handleAddCoin} onClose={()=>setShowAdd(false)}/>}
    </div>
  )
}
