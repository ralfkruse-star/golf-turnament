# App Icons for PWA

## Required Icons

Generate the following icon sizes for the Progressive Web App:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

### Shortcut Icons (Optional)
- `scoring-96x96.png`
- `leaderboard-96x96.png`
- `profile-96x96.png`

### Badge Icon (Optional)
- `badge-72x72.png`

## Icon Generation Tool

Use [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):

```bash
npx pwa-asset-generator logo.png public/icons \
  --background "#ffffff" \
  --padding "10%" \
  --quality 100
```

## Design Guidelines

- **Logo**: Golf-themed (golf ball, flag, tee, etc.)
- **Colors**: Green (#16a34a) for branding
- **Padding**: 10% for safe area
- **Background**: White or transparent
- **Maskable**: Icons should work with circular, square, and squircle masks

## Temporary Placeholder

For development, you can use a simple green circle as a placeholder until proper icons are designed.

**Quick Placeholder Script (ImageMagick):**
```bash
convert -size 512x512 xc:white \
  -fill "#16a34a" \
  -draw "circle 256,256 256,50" \
  icon-512x512.png

# Resize for other sizes
for size in 72 96 128 144 152 192 384; do
  convert icon-512x512.png -resize ${size}x${size} icon-${size}x${size}.png
done
```

## Apple Touch Icon

Apple devices use:
- `apple-touch-icon.png` (180x180)

Generate separately or use the 192px icon.
