import React, { useState, useMemo, useRef } from 'react'

const SHAPES = ['circle', 'square', 'polygon', 'triangle']

function App() {
  const params = new URLSearchParams(window.location.search)
  const urlShape = params.get('shape')
  const urlHide = params.get('hide') !== null

  const defaultConfig = {
    shape: 'circle',
    sides: 6,
    radius: 300,
    glow: 40,
    strokeWidth: 20,
    speed: 1,
    color1: '#ff00ff',
    color2: '#00e5ff'
  }

  const [copied, setCopied] = useState(false)
  const svgRef = useRef(null)

  const [config, setConfig] = useState(() => {
    const cfg = { ...defaultConfig }
    if (urlShape) cfg.shape = urlShape
    if (params.get('sides')) cfg.sides = parseInt(params.get('sides'))
    if (params.get('radius')) cfg.radius = parseInt(params.get('radius'))
    if (params.get('glow')) cfg.glow = parseInt(params.get('glow'))
    if (params.get('speed')) cfg.speed = parseFloat(params.get('speed'))
    if (params.get('strokeWidth')) cfg.strokeWidth = parseInt(params.get('strokeWidth'))
    if (params.get('color1')) cfg.color1 = '#' + params.get('color1').replace('#', '')
    if (params.get('color2')) cfg.color2 = '#' + params.get('color2').replace('#', '')
    return cfg
  })

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const pathData = useMemo(() => {
    const { shape, sides, radius } = config
    const cx = 400, cy = 400, count = 300
    const pts = []
    for (let i = 0; i < count; i++) {
      const t = (i / count) * 2 * Math.PI
      let x, y
      if (shape === 'circle') {
        x = cx + Math.cos(t) * radius
        y = cy + Math.sin(t) * radius
      } else if (shape === 'square') {
        const s = radius, p = i / count
        if (p < 0.25) { x = cx - s + 4 * s * p; y = cy - s; }
        else if (p < 0.5) { x = cx + s; y = cy - s + 4 * s * (p - 0.25); }
        else if (p < 0.75) { x = cx + s - 4 * s * (p - 0.5); y = cy + s; }
        else { x = cx - s; y = cy + s - 4 * s * (p - 0.75); }
      } else if (shape === 'polygon' || shape === 'triangle') {
        const n = shape === 'triangle' ? 3 : sides
        const segCount = count / n
        const idx = Math.floor(i / segCount), next = (idx + 1) % n
        const a1 = (idx / n) * 2 * Math.PI - Math.PI / 2
        const a2 = (next / n) * 2 * Math.PI - Math.PI / 2
        const p = (i % segCount) / segCount
        const x1 = cx + Math.cos(a1) * radius, y1 = cy + Math.sin(a1) * radius
        const x2 = cx + Math.cos(a2) * radius, y2 = cy + Math.sin(a2) * radius
        x = x1 + (x2 - x1) * p
        y = y1 + (y2 - y1) * p
      }
      pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return pts.join(' ') + ' Z'
}, [config])

  const glowFilter = useMemo(() => `glow-${Date.now()}`, [])

  const showPanel = !urlHide && params.toString() === ''

  return (
    <div style={{...styles.container, background: showPanel ? '#0a0a0f' : 'transparent'}}>
      {showPanel && (
        <div style={styles.panel}>
          <h1 style={styles.title}>Neon Generator</h1>
          <div style={styles.group}>
            <label style={styles.label}>Shape</label>
            <div style={styles.grid}>
              {SHAPES.map(s => (
                <button
                  key={s}
                  style={{...styles.btn, ...(config.shape === s ? styles.btnActive : {})}}
                  onClick={() => updateConfig('shape', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {config.shape === 'polygon' && (
            <div style={styles.group}>
              <label style={styles.label}>Sides <span>{config.sides}</span></label>
              <input type="range" min="3" max="12" value={config.sides}
                onChange={e => updateConfig('sides', +e.target.value)} style={styles.slider} />
            </div>
          )}
          <div style={styles.group}>
            <label style={styles.label}>Radius <span>{config.radius}</span></label>
            <input type="range" min="50" max="600" value={config.radius}
              onChange={e => updateConfig('radius', +e.target.value)} style={styles.slider} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Glow <span>{config.glow}</span></label>
            <input type="range" min="10" max="80" value={config.glow}
              onChange={e => updateConfig('glow', +e.target.value)} style={styles.slider} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Speed <span>{config.speed.toFixed(1)}</span></label>
            <input type="range" min="0" max="3" step="0.1" value={config.speed}
              onChange={e => updateConfig('speed', +e.target.value)} style={styles.slider} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Stroke <span>{config.strokeWidth}</span></label>
            <input type="range" min="1" max="40" value={config.strokeWidth}
              onChange={e => updateConfig('strokeWidth', +e.target.value)} style={styles.slider} />
          </div>
          
          <div style={styles.group}>
            <label style={styles.label}>Color 1</label>
            <input type="color" value={config.color1}
              onChange={e => updateConfig('color1', e.target.value)} style={styles.color} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Color 2</label>
            <input type="color" value={config.color2}
              onChange={e => updateConfig('color2', e.target.value)} style={styles.color} />
          </div>
          <div style={styles.group}>
            <button style={styles.copyBtn} onClick={() => {
              const url = new URL(window.location.href.split('?')[0])
              url.searchParams.set('shape', config.shape)
              url.searchParams.set('radius', config.radius)
              url.searchParams.set('glow', config.glow)
              url.searchParams.set('speed', config.speed)
              url.searchParams.set('strokeWidth', config.strokeWidth)
              url.searchParams.set('color1', config.color1.replace('#', ''))
              url.searchParams.set('color2', config.color2.replace('#', ''))
              if (config.shape === 'polygon') url.searchParams.set('sides', config.sides)
              url.searchParams.set('hide', '1')
              navigator.clipboard.writeText(url.toString())
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}>{copied ? 'Copied!' : 'Copy URL'}</button>
          </div>
          <div style={styles.group}>
            <button style={styles.copyBtn} onClick={() => {
              const svg = svgRef.current
              const canvas = document.createElement('canvas')
              canvas.width = 800
              canvas.height = 800
              const ctx = canvas.getContext('2d')
              const data = new XMLSerializer().serializeToString(svg)
              const img = new Image()
              img.onload = () => {
                ctx.drawImage(img, 0, 0)
                const a = document.createElement('a')
                a.download = 'neon-ring.png'
                a.href = canvas.toDataURL('image/png')
                a.click()
              }
              img.src = 'data:image/svg+xml;base64,' + btoa(data)
            }}>Download PNG</button>
          </div>
        </div>
      )}
      <div style={{...styles.preview, background: 'transparent'}}>
        <svg ref={svgRef} viewBox="0 0 800 800" style={styles.svg}>
          <defs>
            <linearGradient id={`${glowFilter}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.color1} />
              <stop offset="100%" stopColor={config.color2} />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation={config.glow / 8} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={pathData} fill="none" stroke={`url(#${glowFilter})`} strokeWidth={config.strokeWidth}
            strokeLinecap="round" strokeLinejoin="round" filter="url(#neonGlow)"
            style={{
              transformOrigin: '400px 400px',
              animation: config.speed > 0 ? `spin ${10 / config.speed}s linear infinite` : 'none'
            }} />
        </svg>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', width: '100vw', height: '100vh', background: '#0a0a0f' },
  panel: { width: 260, background: 'rgba(0,0,0,0.95)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' },
  title: { fontSize: 20, fontWeight: 600, marginBottom: 8,
    background: 'linear-gradient(135deg, #ff00ff, #00e5ff)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  group: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1,
    display: 'flex', justifyContent: 'space-between' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 },
  btn: { padding: '10px 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer', transition: 'all 0.2s' },
  btnActive: { background: 'linear-gradient(135deg, rgba(255,0,255,0.3), rgba(0,229,255,0.3))',
    borderColor: '#00e5ff', color: '#fff', boxShadow: '0 0 15px rgba(0,229,255,0.3)' },
  slider: { width: '100%', height: 6, WebkitAppearance: 'none', appearance: 'none',
    background: 'rgba(255,255,255,0.1)', borderRadius: 3, cursor: 'pointer' },
  color: { width: '100%', height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' },
  copyBtn: { padding: '12px', fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #ff00ff, #00e5ff)',
    border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', marginTop: 8 },
  preview: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', overflow: 'hidden' },
  svg: { width: 600, height: 600 }
}

export default App