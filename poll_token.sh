#!/bin/bash
CLIENT_ID="178c6fc778ccc68e1d6a"
DEVICE_CODE="6b4b6572715724f4d01569f5bc71f5c90ad6039c"
sleep 15
while true; do
  RESPONSE=$(curl -s -X POST https://github.com/login/oauth/access_token \
    -d "client_id=$CLIENT_ID" \
    -d "device_code=$DEVICE_CODE" \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code")
  
  if echo "$RESPONSE" | grep -q "access_token="; then
    TOKEN=$(echo "$RESPONSE" | grep -o 'access_token=[^&]*' | cut -d'=' -f2)
    echo "$TOKEN" > .gh_token
    echo "Successfully authenticated!"
    break
  elif echo "$RESPONSE" | grep -q "authorization_pending"; then
    sleep 10
  else
    echo "Error or expired: $RESPONSE"
    sleep 15
  fi
done
