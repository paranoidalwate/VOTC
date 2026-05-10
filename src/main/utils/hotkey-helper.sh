#!/bin/bash
# VOTC Hotkey Helper for Wayland
# This script sends hotkey commands to the VOTC Unix socket
# Use this script to bind hotkeys in your Wayland compositor (Hyprland, Sway, etc.)

SOCKET_PATH="/tmp/votc-hotkeys.sock"

# Function to send command to socket
send_command() {
    local cmd="$1"
    if [ -S "$SOCKET_PATH" ]; then
        echo "$cmd" | socat - UNIX-CONNECT:"$SOCKET_PATH" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "Sent: $cmd"
        else
            echo "Failed to send command. Is VOTC running?"
            exit 1
        fi
    else
        echo "Socket not found at $SOCKET_PATH. Is VOTC running?"
        exit 1
    fi
}

if ! command -v socat &> /dev/null; then
    echo "Error: socat is not installed."
    echo "Install it with: sudo pacman -S socat (Arch) or sudo apt install socat (Ubuntu/Debian)"
    exit 1
fi

case "$1" in
    toggle-chat)
        send_command "TOGGLE_CHAT"
        ;;
    toggle-settings)
        send_command "TOGGLE_SETTINGS"
        ;;
    *)
        echo "Usage: $0 {toggle-chat|toggle-settings}"
        echo ""
        echo "Examples for Hyprland (~/.config/hypr/hyprland.conf):"
        echo "  bind = \$mainMod, H, exec, $0 toggle-chat"
        echo "  bind = \$mainMod SHIFT, H, exec, $0 toggle-settings"
        echo ""
        echo "Examples for Sway (~/.config/sway/config):"
        echo "  bindsym \$mod+H exec $0 toggle-chat"
        echo "  bindsym \$mod+Shift+H exec $0 toggle-settings"
        exit 1
        ;;
esac
