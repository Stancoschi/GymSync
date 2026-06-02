# GymSync PWA Icons

Generate all icon sizes from a single 1024x1024 source image.

## Required sizes
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Quick generation (requires ImageMagick or sharp)

```bash
# With ImageMagick — run from project root
for size in 72 96 128 144 152 192 384 512; do
  convert public/icons/icon-1024x1024.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done
```

## Online alternative
https://maskable.app/editor — upload your logo, export all sizes as maskable icons.

## Design notes
- Use a **safe zone** of 80% (icon centered in 80% of canvas) for maskable icons
- Background: #0a0a0a (matches manifest theme_color)
- Foreground: white GymSync dumbbell/G logo
