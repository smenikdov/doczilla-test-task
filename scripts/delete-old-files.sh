#!/bin/bash

# необходимо настроить крон для выполнения каждые 30 дней
URL="https://host.example.com/api/delete-old-files"
LOG_FILE="/var/log/cron_request.log"

curl -X POST "$URL" -H "Content-Type: application/json" >> $LOG_FILE 2>&1
