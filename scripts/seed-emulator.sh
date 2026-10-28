#!/bin/sh
# Crea l'account admin SOLO nell'emulatore locale (npm run emulators), con password di test ed email già verificata.
EMU="http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1"
ADMIN_UID=$(curl -s -X POST "$EMU/accounts:signUp?key=fake-api-key" -H 'Content-Type: application/json' \
  -d '{"email":"base.basement.workspace@gmail.com","password":"emulatore-admin","returnSecureToken":true}' | sed -n 's/.*"localId": *"\([^"]*\)".*/\1/p')
curl -s -X POST "$EMU/projects/basement-fa904/accounts:update" -H 'Authorization: Bearer owner' -H 'Content-Type: application/json' \
  -d "{\"localId\":\"$ADMIN_UID\",\"emailVerified\":true}" > /dev/null && echo "Admin di test creato nell'emulatore ($ADMIN_UID)"
