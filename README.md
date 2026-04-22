# Neon Ring Generator

Dynamic neon ring generator for OBS Browser Source.

## Run

```bash
npm install
npm run dev
```

Visit https://holywen.github.io/neon-shape-generator/

## URL Parameters

| Parameter | Default | Range | Description |
|----------|--------|-------|--------|
| shape | circle | - | circle, square, roundRect, polygon, triangle |
| sides | 6 | 3-12 | Polygon sides (polygon only) |
| radius | 300 | 50-600 | Ring radius |
| glow | 40 | 10-80 | Glow intensity |
| speed | 1 | 0-3 | Rotation speed (0 = no rotation) |
| strokeWidth | 20 | 1-40 | Outer glow line width |
| coreWidth | 3 | 0-20 | White core line width (0 = off) |
| color1 | ff00ff | - | Start color (HEX) |
| color2 | 00e5ff | - | End color (HEX) |
| spotCount | 0 | 0-24 | Number of white glow spots on the ring |
| spotSize | 4 | 1-60 | Spot size (visible when spotCount > 0) |
| cornerRadius | 60 | 0-radius | Corner radius (roundRect, polygon, triangle) |
| lang | zh | zh / en | UI language |
| hide | - | - | Hide control panel |

## Examples

```bash
# Pentagon, large glow
?shape=polygon&strokeWidth=30&sides=5&glow=60&hide=1

# Triangle, fast rotation
?shape=triangle&strokeWidth=30&speed=2&hide=1

# Circle, cyan glow with spots
?shape=circle&strokeWidth=30&color1=00ffff&color2=0088ff&spotCount=8&spotSize=10&hide=1

# Thick ring with bright core
?shape=circle&strokeWidth=30&coreWidth=10&glow=50&hide=1

# Rounded rectangle
?shape=roundRect&cornerRadius=80&spotCount=8&spotSize=8&hide=1

# Rounded hexagon with spots
?shape=polygon&sides=6&cornerRadius=40&spotCount=12&spotSize=6&hide=1

# Rounded triangle
?shape=triangle&cornerRadius=60&spotCount=6&spotSize=8&hide=1

# English UI
?shape=circle&lang=en&hide=1
```

## OBS Setup

1. Add Browser Source
2. URL: `http://localhost:3000?shape=circle&hide=1` (replace with your params)
3. Width/Height: 600x600
4. Enable "Refresh on scene activation" (optional)