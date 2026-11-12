#!/usr/bin/env bash
# Builds the openGym-N release APK and signs it with your own keystore (never in the repository).
#
# Usage: scripts/android/glyph-release.sh [out-dir]
#   KEYSTORE   default ~/.config/opengymn/opengymn.jks
#   KEY_ALIAS  default opengymn
#   SKIP_WEB=1 skip `npm run build:mobile` (use when only the Android code changed)
#   ANDROID_HOME must point at the Android SDK (platform 36, build-tools 36.0.0)
# apksigner asks for the keystore password; it is not stored anywhere.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
OUT=${1:-$HOME}
KEYSTORE=${KEYSTORE:-$HOME/.config/opengymn/opengymn.jks}
KEY_ALIAS=${KEY_ALIAS:-opengymn}
: "${ANDROID_HOME:?set ANDROID_HOME}"
[ -f "$KEYSTORE" ] || { echo "no keystore at $KEYSTORE" >&2; exit 1; }
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)

cd "$ROOT/frontend"
[ "${SKIP_WEB:-}" = 1 ] || npm run build:mobile
cd android
./gradlew assembleSideloadRelease

REL=app/build/outputs/apk/sideload/release
UNSIGNED=$(ls "$REL"/*-unsigned.apk | head -1)
ALIGNED=$(mktemp -u).apk
"$BT/zipalign" -p -f 4 "$UNSIGNED" "$ALIGNED"
"$BT/apksigner" sign --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" --out "$OUT/openGym-N.apk" "$ALIGNED"
rm -f "$ALIGNED"
"$BT/apksigner" verify --print-certs "$OUT/openGym-N.apk" | grep -i "SHA-256"
echo "signed: $OUT/openGym-N.apk"
