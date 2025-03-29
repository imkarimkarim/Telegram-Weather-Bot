#!/bin/bash

# Set log file
LOG_FILE="./logs/app-monitor.log"
mkdir -p ./logs
touch "$LOG_FILE"

# Function to cleanup existing processes
cleanup() {
    echo "[$(date)] Cleaning up existing processes..."
    pkill -f "node dist/index.js"
}

# Function to start the node process
start_node_process() {
    cleanup
    echo "[$(date)] Starting node process..."
    echo "[$(date)] Starting node process..." >> "$LOG_FILE"
    npm run start 2>&1 | tee -a "$LOG_FILE" &
    sleep 2  # Give the process time to start
}

# Build the project first
echo "[$(date)] Building project..."
echo "[$(date)] Building project..." >> "$LOG_FILE"
npm run build 2>&1 | tee -a "$LOG_FILE"

# Cleanup any existing processes before starting
cleanup

# Start the node process initially
start_node_process

# Monitor and restart using forever loop
while true; do
    if ! pgrep -f "node dist/index.js" > /dev/null; then
        echo "[$(date)] Process died, restarting..."
        echo "[$(date)] Process died, restarting..." >> "$LOG_FILE"
        start_node_process
    fi
    sleep 10
done 