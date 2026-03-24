#!/bin/bash
# Crea la app RoSummary.app para el Dock de macOS
# Abre rosummary.vercel.app como PWA en Chrome

APP_NAME="RoSummary"
APP_PATH="$HOME/Applications/$APP_NAME.app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ICNS_FILE="$SCRIPT_DIR/$APP_NAME.icns"
URL="https://rosummary.vercel.app"

echo "📦 Creando $APP_NAME.app..."

# Crear estructura de bundle
mkdir -p "$APP_PATH/Contents/MacOS"
mkdir -p "$APP_PATH/Contents/Resources"

# Script de lanzamiento
cat > "$APP_PATH/Contents/MacOS/$APP_NAME" << 'LAUNCHER'
#!/bin/bash
URL="https://rosummary.vercel.app"

# Intentar abrir como PWA en Chrome
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$URL" --window-size=1200,800
elif [ -d "/Applications/Brave Browser.app" ]; then
  open -na "Brave Browser" --args --app="$URL"
else
  # Fallback: Safari
  open "$URL"
fi
LAUNCHER

chmod +x "$APP_PATH/Contents/MacOS/$APP_NAME"

# Info.plist
cat > "$APP_PATH/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>$APP_NAME</string>
  <key>CFBundleDisplayName</key>
  <string>$APP_NAME</string>
  <key>CFBundleIdentifier</key>
  <string>com.ro.rosummary</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleSignature</key>
  <string>????</string>
  <key>CFBundleExecutable</key>
  <string>$APP_NAME</string>
  <key>CFBundleIconFile</key>
  <string>$APP_NAME</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

# Copiar ícono
if [ -f "$ICNS_FILE" ]; then
  cp "$ICNS_FILE" "$APP_PATH/Contents/Resources/$APP_NAME.icns"
  echo "  ✓ Ícono aplicado"
fi

# Refrescar caché de ícono de macOS
touch "$APP_PATH"
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -f "$APP_PATH" 2>/dev/null

echo ""
echo "✅ App creada en: $APP_PATH"
echo ""
echo "Para agregar al Dock:"
echo "  1. Abre Finder → Ir → Aplicaciones"
echo "  2. Arrastra 'RoSummary.app' al Dock"
echo ""
echo "O abre directamente ahora con:"
echo "  open \"$APP_PATH\""
