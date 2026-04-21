#!/bin/bash
# =========================================
# 자동 견적 시스템 - 백엔드 실행 스크립트
# =========================================

cd "$(dirname "$0")/backend"

echo "📦 패키지 설치 중..."
pip install -r requirements.txt -q

echo ""
echo "🚀 백엔드 서버 시작 (포트 8000)..."
echo "   API 문서: http://localhost:8000/docs"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
