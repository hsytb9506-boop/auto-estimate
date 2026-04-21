#!/bin/bash
# =========================================
# 자동 견적 시스템 - 프론트엔드 실행 스크립트
# =========================================

cd "$(dirname "$0")/frontend"

echo "📦 npm 패키지 설치 중..."
npm install

echo ""
echo "🚀 프론트엔드 시작 (포트 3000)..."
echo "   접속 주소: http://localhost:3000"
echo ""

npm run dev
