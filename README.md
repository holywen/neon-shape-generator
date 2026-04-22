# Neon Ring Generator

Dynamic neon ring generator for OBS Browser Source.

## Run

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## URL Parameters

| Parameter | Default | Range | Description |
|----------|--------|-------|--------|
| shape | circle | - | circle, square, polygon, triangle |
| sides | 6 | 3-12 | Polygon sides (polygon only) |
| radius | 300 | 50-600 | Ring radius |
| glow | 40 | 10-80 | Glow intensity |
| speed | 1 | 0-3 | Rotation speed (0 = no rotation) |
| strokeWidth | 20 | 1-40 | Line width |
| color1 | ff00ff | - | Start color (HEX) |
| color2 | 00e5ff | - | End color (HEX) |
| hide | - | - | Hide control panel |

## Examples

```bash
# Pentagon, large glow
?shape=polygon&sides=5&glow=60&hide=1

# Triangle, fast rotation
?shape=triangle&speed=2&hide=1

# Circle, cyan glow
?shape=circle&color1=00ffff&color2=0088ff&hide=1
```

## OBS Setup

1. Add Browser Source
2. URL: `http://localhost:3000?shape=circle&hide=1` (replace with your params)
3. Width/Height: 600x600
4. Enable "Refresh on scene activation" (optional)