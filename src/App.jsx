import React, { useState, useMemo, useRef } from 'react'

const SHAPES = ['circle', 'square', 'roundRect', 'polygon', 'triangle']

function getRoundRectPoint(p, cx, cy, s, r) {
  const segLen = 2 * s - 2 * r
  const arcLen = Math.PI * r / 2
  const totalLen = 4 * segLen + 4 * arcLen
  let d = ((p % 1) + 1) % 1 * totalLen
  const segments = [
    { type: 'line', len: segLen, x0: cx - s + r, y0: cy - s, dx: 1, dy: 0 },
    { type: 'arc', len: arcLen, cx: cx + s - r, cy: cy - s + r, startAngle: -Math.PI / 2 },
    { type: 'line', len: segLen, x0: cx + s, y0: cy - s + r, dx: 0, dy: 1 },
    { type: 'arc', len: arcLen, cx: cx + s - r, cy: cy + s - r, startAngle: 0 },
    { type: 'line', len: segLen, x0: cx + s - r, y0: cy + s, dx: -1, dy: 0 },
    { type: 'arc', len: arcLen, cx: cx - s + r, cy: cy + s - r, startAngle: Math.PI / 2 },
    { type: 'line', len: segLen, x0: cx - s, y0: cy + s - r, dx: 0, dy: -1 },
    { type: 'arc', len: arcLen, cx: cx - s + r, cy: cy - s + r, startAngle: Math.PI },
  ]
  for (const seg of segments) {
    if (d <= seg.len) {
      if (seg.type === 'line') {
        return { x: seg.x0 + seg.dx * d, y: seg.y0 + seg.dy * d }
      } else {
        const angle = seg.startAngle + (d / r)
        return { x: seg.cx + Math.cos(angle) * r, y: seg.cy + Math.sin(angle) * r }
      }
    }
    d -= seg.len
  }
  return { x: cx - s + r, y: cy - s }
}

function getRoundPolygonPoint(p, cx, cy, radius, n, R) {
  const a0 = -Math.PI / 2
  const maxR = radius * Math.cos(Math.PI / n)
  const r = Math.min(R, maxR)

  if (r <= 0 || n < 3) {
    const idx = Math.floor(p * n), next = (idx + 1) % n
    const a1 = (idx / n) * 2 * Math.PI + a0
    const a2 = (next / n) * 2 * Math.PI + a0
    const t = (p * n) % 1
    const x1 = cx + Math.cos(a1) * radius, y1 = cy + Math.sin(a1) * radius
    const x2 = cx + Math.cos(a2) * radius, y2 = cy + Math.sin(a2) * radius
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t }
  }

  const sideLen = 2 * radius * Math.sin(Math.PI / n)
  const d = r * Math.tan(Math.PI / n)
  const arcLen = r * 2 * Math.PI / n
  const segLen = Math.max(0, sideLen - 2 * d)
  const cycleLen = segLen + arcLen
  const totalLen = n * cycleLen

  let dist = ((p % 1) + 1) % 1 * totalLen
  const idx = Math.floor(dist / cycleLen)
  dist -= idx * cycleLen

  const i = idx
  const ai = (i / n) * 2 * Math.PI + a0
  const ai1 = (((i + 1) % n) / n) * 2 * Math.PI + a0
  const Vi = { x: cx + Math.cos(ai) * radius, y: cy + Math.sin(ai) * radius }
  const Vi1 = { x: cx + Math.cos(ai1) * radius, y: cy + Math.sin(ai1) * radius }

  const dir = { x: Vi1.x - Vi.x, y: Vi1.y - Vi.y }
  const dirLen = Math.sqrt(dir.x * dir.x + dir.y * dir.y)
  dir.x /= dirLen; dir.y /= dirLen

  if (dist < segLen) {
    const segStart = { x: Vi.x + d * dir.x, y: Vi.y + d * dir.y }
    const segEnd = { x: Vi1.x - d * dir.x, y: Vi1.y - d * dir.y }
    const t = segLen > 0 ? dist / segLen : 0
    return { x: segStart.x + (segEnd.x - segStart.x) * t, y: segStart.y + (segEnd.y - segStart.y) * t }
  } else {
    const arcDist = dist - segLen
    const t = arcLen > 0 ? arcDist / arcLen : 0

    const h = r / Math.cos(Math.PI / n)
    const Ci = { x: Vi1.x - Math.cos(ai1) * h, y: Vi1.y - Math.sin(ai1) * h }

    const P_start = { x: Vi1.x - d * dir.x, y: Vi1.y - d * dir.y }

    const ai2 = (((i + 2) % n) / n) * 2 * Math.PI + a0
    const Vi2 = { x: cx + Math.cos(ai2) * radius, y: cy + Math.sin(ai2) * radius }
    const dirNext = { x: Vi2.x - Vi1.x, y: Vi2.y - Vi1.y }
    const dirNextLen = Math.sqrt(dirNext.x * dirNext.x + dirNext.y * dirNext.y)
    dirNext.x /= dirNextLen; dirNext.y /= dirNextLen
    const P_end = { x: Vi1.x + d * dirNext.x, y: Vi1.y + d * dirNext.y }

    let theta_start = Math.atan2(P_start.y - Ci.y, P_start.x - Ci.x)
    let theta_end = Math.atan2(P_end.y - Ci.y, P_end.x - Ci.x)

    let delta = theta_end - theta_start
    while (delta <= -Math.PI) delta += 2 * Math.PI
    while (delta > Math.PI) delta -= 2 * Math.PI

    const angle = theta_start + t * delta
    return { x: Ci.x + Math.cos(angle) * r, y: Ci.y + Math.sin(angle) * r }
  }
}

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
    coreWidth: 3,
    speed: 1,
    color1: '#ff00ff',
    color2: '#00e5ff',
    spotCount: 0,
    spotSize: 4,
    cornerRadius: 60
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
    if (params.get('coreWidth')) cfg.coreWidth = parseInt(params.get('coreWidth'))
    if (params.get('color1')) cfg.color1 = '#' + params.get('color1').replace('#', '')
    if (params.get('color2')) cfg.color2 = '#' + params.get('color2').replace('#', '')
    if (params.get('spotCount')) cfg.spotCount = parseInt(params.get('spotCount'))
    if (params.get('spotSize')) cfg.spotSize = parseInt(params.get('spotSize'))
    if (params.get('cornerRadius')) cfg.cornerRadius = parseInt(params.get('cornerRadius'))
    return cfg
  })

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const pathData = useMemo(() => {
    const { shape, sides, radius, cornerRadius } = config
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
      } else if (shape === 'roundRect') {
        const r = Math.min(cornerRadius, radius)
        const pt = getRoundRectPoint(i / count, cx, cy, radius, r)
        x = pt.x; y = pt.y
      } else if (shape === 'polygon' || shape === 'triangle') {
        const n = shape === 'triangle' ? 3 : sides
        const pt = getRoundPolygonPoint(i / count, cx, cy, radius, n, cornerRadius)
        x = pt.x; y = pt.y
      }
      pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    return pts.join(' ') + ' Z'
}, [config])

  const spotPositions = useMemo(() => {
    const { shape, sides, radius, spotCount, cornerRadius } = config
    if (spotCount <= 0) return []
    const cx = 400, cy = 400
    const pts = []
    for (let i = 0; i < spotCount; i++) {
      const t = (i / spotCount) * 2 * Math.PI
      let x, y
      if (shape === 'circle') {
        x = cx + Math.cos(t) * radius
        y = cy + Math.sin(t) * radius
      } else if (shape === 'square') {
        const s = radius, p = i / spotCount
        if (p < 0.25) { x = cx - s + 4 * s * p; y = cy - s; }
        else if (p < 0.5) { x = cx + s; y = cy - s + 4 * s * (p - 0.25); }
        else if (p < 0.75) { x = cx + s - 4 * s * (p - 0.5); y = cy + s; }
        else { x = cx - s; y = cy + s - 4 * s * (p - 0.75); }
      } else if (shape === 'roundRect') {
        const r = Math.min(cornerRadius, radius)
        const pt = getRoundRectPoint(i / spotCount, cx, cy, radius, r)
        x = pt.x; y = pt.y
      } else if (shape === 'polygon' || shape === 'triangle') {
        const n = shape === 'triangle' ? 3 : sides
        const pt = getRoundPolygonPoint(i / spotCount, cx, cy, radius, n, cornerRadius)
        x = pt.x; y = pt.y
      }
      pts.push({ x, y })
    }
    return pts
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
          {['roundRect', 'polygon', 'triangle'].includes(config.shape) && (
            <div style={styles.group}>
              <label style={styles.label}>Corner <span>{config.cornerRadius}</span></label>
              <input type="range" min="0" max={config.radius} value={Math.min(config.cornerRadius, config.radius)}
                onChange={e => updateConfig('cornerRadius', +e.target.value)} style={styles.slider} />
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
            <label style={styles.label}>Core <span>{config.coreWidth}</span></label>
            <input type="range" min="0" max="20" value={config.coreWidth}
              onChange={e => updateConfig('coreWidth', +e.target.value)} style={styles.slider} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Spots <span>{config.spotCount}</span></label>
            <input type="range" min="0" max="24" value={config.spotCount}
              onChange={e => updateConfig('spotCount', +e.target.value)} style={styles.slider} />
          </div>
          {config.spotCount > 0 && (
            <div style={styles.group}>
              <label style={styles.label}>Spot Size <span>{config.spotSize}</span></label>
              <input type="range" min="1" max="60" value={config.spotSize}
                onChange={e => updateConfig('spotSize', +e.target.value)} style={styles.slider} />
            </div>
          )}
          
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
              url.searchParams.set('coreWidth', config.coreWidth)
              url.searchParams.set('color1', config.color1.replace('#', ''))
              url.searchParams.set('color2', config.color2.replace('#', ''))
              url.searchParams.set('spotCount', config.spotCount)
              if (config.spotCount > 0) url.searchParams.set('spotSize', config.spotSize)
              if (config.shape === 'polygon') url.searchParams.set('sides', config.sides)
              if (config.shape === 'roundRect') url.searchParams.set('cornerRadius', config.cornerRadius)
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
            <radialGradient id="spotGlow">
              <stop offset="0%" stopColor="white" stopOpacity="0.6" />
              <stop offset="50%" stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g style={{
            transformOrigin: '400px 400px',
            animation: config.speed > 0 ? `spin ${10 / config.speed}s linear infinite` : 'none'
          }}>
            <path d={pathData} fill="none" stroke={`url(#${glowFilter})`} strokeWidth={config.strokeWidth}
              strokeLinecap="round" strokeLinejoin="round" filter="url(#neonGlow)" />
            <path d={pathData} fill="none" stroke="white" strokeWidth={config.coreWidth}
              strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            {config.spotCount > 0 && spotPositions.map((pos, i) => (
              <g key={i}>
                <circle cx={pos.x} cy={pos.y} r={config.spotSize * 2}
                  fill="url(#spotGlow)" />
                <circle cx={pos.x} cy={pos.y} r={config.spotSize * 0.4}
                  fill="white" opacity="0.95" />
              </g>
            ))}
          </g>
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