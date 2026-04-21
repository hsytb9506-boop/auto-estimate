# 🏗 자동 견적 시스템

건축 / 토목 완전 분리형 웹 기반 자동 견적 시스템

---

## 📁 폴더 구조

```
auto-estimate/
├── backend/
│   ├── main.py          # FastAPI 전체 API
│   ├── models.py        # DB 모델 (SQLAlchemy)
│   ├── schemas.py       # Pydantic 스키마
│   ├── database.py      # DB 연결
│   ├── auth.py          # JWT 인증
│   ├── seed.py          # 초기 데이터
│   └── requirements.txt
│
├── frontend/
│   ├── pages/
│   │   ├── index.js              # 메인 (건축/토목 선택)
│   │   ├── login.js              # 로그인
│   │   ├── architecture/
│   │   │   ├── index.js          # 건축 견적 목록
│   │   │   ├── new.js            # 건축 견적 작성
│   │   │   └── [id]/
│   │   │       ├── index.js      # 건축 견적 상세
│   │   │       └── edit.js       # 건축 견적 수정
│   │   ├── civil/
│   │   │   ├── index.js          # 토목 견적 목록
│   │   │   ├── new.js            # 토목 견적 작성
│   │   │   └── [id]/
│   │   │       ├── index.js      # 토목 견적 상세
│   │   │       └── edit.js       # 토목 견적 수정
│   │   └── admin/
│   │       └── index.js          # 관리자 페이지
│   ├── components/
│   │   ├── Layout.js             # 공통 레이아웃
│   │   ├── QuoteEditor.js        # 견적 입력 폼
│   │   └── QuoteView.js          # 견적서 출력 뷰
│   └── lib/
│       ├── api.js                # API 클라이언트
│       └── export.js             # PDF 출력
│
├── start_backend.sh
├── start_frontend.sh
└── README.md
```

---

## 🗄️ DB 테이블 구조

| 테이블 | 설명 |
|--------|------|
| `domains` | 건축/토목 도메인 구분 |
| `categories` | 공종 대분류 (domain_id로 분리) |
| `items` | 품목 마스터 (공종별) |
| `price_master` | 최신 단가 (유효일 포함) |
| `price_history` | 단가 변경 이력 |
| `percent_master` | 노무비/경비/이윤 등 퍼센트 |
| `quotes` | 견적서 헤더 (작성 당시 퍼센트 고정) |
| `quote_items` | 견적서 상세 (작성 당시 단가 고정) |
| `users` | 사용자 (관리자/일반) |

---

## 🚀 로컬 실행 방법

### 사전 준비
- Python 3.10+
- Node.js 18+

### 1. 백엔드 실행 (터미널 1)
```bash
cd auto-estimate/backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
# → API 문서: http://localhost:8000/docs
```

### 2. 프론트엔드 실행 (터미널 2)
```bash
cd auto-estimate/frontend
npm install
npm run dev
# → http://localhost:3000
```

### 3. 접속
브라우저에서 http://localhost:3000 접속

```
관리자 계정: admin / admin1234
일반 계정:   user  / user1234
```

---

## 🌐 배포 방법

### 옵션 A: Railway (무료, 추천)

1. GitHub에 코드 업로드
2. [railway.app](https://railway.app) 에서 New Project
3. 백엔드: Python 서비스로 배포
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 프론트엔드: Node 서비스로 배포
   - 환경변수: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`

### 옵션 B: Vercel (프론트) + Render (백엔드)

**백엔드 (Render)**
1. [render.com](https://render.com) → New Web Service
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 무료 티어 사용 가능

**프론트엔드 (Vercel)**
1. [vercel.com](https://vercel.com) → Import Git
2. `next.config.js`의 proxy destination을 Render URL로 변경
3. 배포 완료

### 옵션 C: VPS 직접 배포

```bash
# 백엔드 (systemd 서비스)
sudo nano /etc/systemd/system/estimate-backend.service

[Unit]
Description=Estimate Backend
[Service]
WorkingDirectory=/var/www/estimate/backend
ExecStart=uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
[Install]
WantedBy=multi-user.target

# 프론트엔드
cd frontend
npm run build
npm start  # 또는 PM2 사용
```

---

## ⚙️ 주요 기능

| 기능 | 설명 |
|------|------|
| 건축/토목 완전 분리 | 품목·단가·견적·템플릿 모두 별도 |
| H빔 중량 계산 | 단위중량×길이×수량 자동 계산 |
| 각파이프 계산 | kg당 단가 기반 자동 계산 |
| 노무비/이율 계산 | 자재비→노무비→경비→이윤→부가세 |
| 단가 이력 관리 | 변경 이력 저장, 기존 견적 단가 고정 |
| 즐겨찾기 | 자주 쓰는 품목 로컬 저장 |
| 엑셀 다운로드 | 서버에서 xlsx 생성 |
| PDF 출력 | 브라우저 내 PDF 생성 |
| CSV 일괄 업데이트 | 단가 대량 수정 지원 |
| 모바일 대응 | 하단 탭 네비게이션 |

---

## 📊 초기 단가 데이터

| 분류 | 기준 | 초기 단가 |
|------|------|---------|
| 판넬 | 새롬패널(주) 파주 | EPS 50T: 18,000원/M ~ |
| 후레싱 | 새롬패널(주) 파주 | 일반: 12,000원/M ~ |
| H빔 | 인천 빔업체 | 1,100원/kg |
| 각파이프 | - | 950원/kg |

모든 단가는 관리자 페이지에서 즉시 수정 가능합니다.
