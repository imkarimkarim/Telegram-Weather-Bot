#!/bin/bash

# Set log file
LOG_FILE="./logs/app.log"
mkdir -p ./logs
touch "$LOG_FILE"

# Log and execute commands
echo "[$(date)] Starting deployment..." >> "$LOG_FILE"

echo "[$(date)] Pulling latest changes..." >> "$LOG_FILE"
git pull 2>&1 | tee -a "$LOG_FILE"

echo "[$(date)] Building project..." >> "$LOG_FILE"
npm run build 2>&1 | tee -a "$LOG_FILE"

echo "[$(date)] Starting application..." >> "$LOG_FILE"
npm run start 2>&1 | tee -a "$LOG_FILE" 