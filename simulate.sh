#!/bin/bash
# Simulation Script for Fase 1

API_URL="http://127.0.0.1:8787"

echo "=== STEP 1: LOGIN AS PUSAT ==="
PUSAT_LOGIN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@umroh.com","password":"admin123"}')

PUSAT_TOKEN=$(echo $PUSAT_LOGIN | grep -oP '(?<="accessToken":")[^"]*')
echo "Pusat Token acquired."

echo -e "\n=== STEP 2: CREATE CABANG (via Pusat) ==="
CREATE_CABANG=$(curl -s -X POST $API_URL/api/users \
  -H "Authorization: Bearer $PUSAT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cabang Jabar","email":"jabar@umroh.com","password":"password123"}')
echo "Response: $CREATE_CABANG"

echo -e "\n=== STEP 3: LOGIN AS CABANG ==="
CABANG_LOGIN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jabar@umroh.com","password":"password123"}')

CABANG_TOKEN=$(echo $CABANG_LOGIN | grep -oP '(?<="accessToken":")[^"]*')
echo "Cabang Token acquired."

echo -e "\n=== STEP 4: CREATE MITRA (via Cabang) ==="
CREATE_MITRA=$(curl -s -X POST $API_URL/api/users \
  -H "Authorization: Bearer $CABANG_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mitra Bekasi","email":"bekasi@umroh.com","password":"password123"}')
echo "Response: $CREATE_MITRA"

echo -e "\n=== STEP 5: VERIFY PUSAT DOWNLINES (should see both) ==="
curl -s -X GET $API_URL/api/users/downline \
  -H "Authorization: Bearer $PUSAT_TOKEN" | jq .

echo -e "\n=== STEP 6: VERIFY CABANG DOWNLINES (should see only Mitra) ==="
curl -s -X GET $API_URL/api/users/downline \
  -H "Authorization: Bearer $CABANG_TOKEN" | jq .
