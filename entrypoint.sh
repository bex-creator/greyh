#!/usr/bin/env bash
set -e

# 1. Configuration variables
export DISPLAY=:99
export SCREEN_WIDTH=1280
export SCREEN_HEIGHT=720
export SCREEN_DEPTH=24

echo "Starting virtual display buffer (Xvfb) on $DISPLAY..."
Xvfb $DISPLAY -screen 0 ${SCREEN_WIDTH}x${SCREEN_HEIGHT}x${SCREEN_DEPTH} +extension GLX +extension RRENDER -listen tcp &
XVFB_PID=$!

# Wait for Xvfb to become ready
sleep 1

echo "Starting desktop session (Openbox / Xfce)..."
dbus-launch openbox-session &

echo "Starting streaming and input gateway server..."
node server.js
