#!/usr/bin/env bash
# Regenerates the PWA icons, favicon and iOS launch screens from the SVG sources in
# static/icons/src. Needs rsvg-convert and ImageMagick 7 (`brew install librsvg imagemagick`).
# Prints the apple-touch-startup-image <link> tags for src/app.html.
set -euo pipefail

cd "$(dirname "$0")/.."
src=static/icons/src
out=static/icons
bg='#0a0f1a'

render() { rsvg-convert -w "$2" -h "$2" "$src/$1" -o "$3"; }

render icon.svg 192 "$out/icon-192.png"
render icon.svg 512 "$out/icon-512.png"
render icon.svg 180 "$out/apple-touch-icon.png"
render icon-maskable.svg 512 "$out/icon-maskable-512.png"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
for s in 16 32 48; do render icon.svg "$s" "$tmp/fav-$s.png"; done
magick "$tmp/fav-16.png" "$tmp/fav-32.png" "$tmp/fav-48.png" static/favicon.ico

# iOS launch screens, portrait only (the manifest locks orientation): CSS width, height, pixel ratio.
devices=(
	'440 956 3' '402 874 3' '430 932 3' '393 852 3' '428 926 3' '390 844 3' '375 812 3'
	'414 896 3' '414 896 2' '414 736 3' '375 667 2' '320 568 2'
	'1024 1366 2' '834 1194 2' '820 1180 2' '834 1112 2' '810 1080 2' '768 1024 2' '744 1133 2'
)
mkdir -p "$out/splash"
rm -f "$out/splash"/*.png
for d in "${devices[@]}"; do
	read -r w h r <<<"$d"
	pw=$((w * r)) ph=$((h * r))
	icon=$((pw * 2 / 5))
	file="apple-splash-${pw}x${ph}.png"
	render icon.svg "$icon" "$tmp/splash-icon.png"
	magick -size "${pw}x${ph}" "xc:$bg" "$tmp/splash-icon.png" -gravity center -composite -strip "$out/splash/$file"
	printf '\t\t<link rel="apple-touch-startup-image" href="%%sveltekit.assets%%/icons/splash/%s" media="(device-width: %spx) and (device-height: %spx) and (-webkit-device-pixel-ratio: %s) and (orientation: portrait)" />\n' \
		"$file" "$w" "$h" "$r"
done
