#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "→ Installing JS dependencies..."
npm install

echo "→ Regenerating native iOS project..."
APP_VARIANT=production npx expo prebuild --platform ios --clean

echo "→ Installing CocoaPods..."
cd ios && pod install && cd ..

echo "→ Opening in Xcode..."
open ios/HabiCard.xcworkspace

echo ""
echo "In Xcode:"
echo "  1. Select your iPhone from the device list (top bar)"
echo "  2. Product → Scheme → Edit Scheme → set Build Configuration to Release"
echo "  3. Product → Archive"
echo "  4. In the Organizer, click Distribute App → Direct Distribution → Export"
echo "  5. Drag the .ipa onto your device in Finder, or use Xcode → Devices & Simulators to install"
