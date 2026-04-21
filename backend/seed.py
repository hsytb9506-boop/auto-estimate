"""
초기 데이터 시드 스크립트
최초 실행 시 1회만 동작합니다.
"""
from models import (Domain, Category, Item, PriceMaster,
                    PercentMaster, User)
from auth import hash_password
from datetime import datetime


def run_seed(db):
    print("🌱 초기 데이터 시드 시작...")

    # ── 도메인
    arch = Domain(code="architecture", name="건축")
    civil = Domain(code="civil", name="토목")
    db.add_all([arch, civil]); db.flush()

    # ── 기본 사용자 (admin / admin1234)
    admin = User(username="admin", hashed_password=hash_password("admin1234"), is_admin=True)
    user  = User(username="user",  hashed_password=hash_password("user1234"),  is_admin=False)
    db.add_all([admin, user]); db.flush()

    # ────────────────────────────────────────────
    # 건축 퍼센트
    # ────────────────────────────────────────────
    for i, (name, pct) in enumerate([
        ("노무비", 20), ("경비", 5), ("일반관리비", 5), ("이윤", 5), ("부가세", 10)
    ]):
        db.add(PercentMaster(domain_id=arch.id, name=name, percent=pct, sort_order=i))

    # 토목 퍼센트
    for i, (name, pct) in enumerate([
        ("노무비", 25), ("경비", 7), ("일반관리비", 6), ("이윤", 5), ("부가세", 10)
    ]):
        db.add(PercentMaster(domain_id=civil.id, name=name, percent=pct, sort_order=i))

    db.flush()

    # ────────────────────────────────────────────
    # 헬퍼
    # ────────────────────────────────────────────
    def cat(domain, name, order):
        c = Category(domain_id=domain.id, name=name, sort_order=order)
        db.add(c); db.flush(); return c

    def item(category, name, spec="", unit="식", price=0, supplier="",
             unit_weight=None, is_weight_based=False, sort=0):
        it = Item(
            category_id=category.id, name=name, spec=spec, unit=unit,
            supplier=supplier, unit_weight=unit_weight,
            is_weight_based=is_weight_based, sort_order=sort
        )
        db.add(it); db.flush()
        db.add(PriceMaster(item_id=it.id, price=price))
        return it

    # ════════════════════════════════════════════
    # 건축 카테고리 & 품목
    # ════════════════════════════════════════════

    # 가설공사
    c = cat(arch, "가설공사", 1)
    item(c, "가설울타리", "H2.0m", "m", 25000, sort=1)
    item(c, "가설화장실", "이동식", "개소", 300000, sort=2)
    item(c, "현장사무소", "컨테이너", "동", 1500000, sort=3)
    item(c, "안전발판", "강재", "㎡", 15000, sort=4)
    item(c, "가설전기공사", "인입 포함", "식", 500000, sort=5)
    item(c, "가설수도공사", "", "식", 300000, sort=6)

    # 기초공사
    c = cat(arch, "기초공사", 2)
    item(c, "터파기", "굴삭기", "㎥", 12000, sort=1)
    item(c, "잡석다짐", "t150", "㎡", 18000, sort=2)
    item(c, "버림콘크리트", "t100, 18MPa", "㎡", 22000, sort=3)
    item(c, "기초콘크리트", "24MPa, 철근포함", "㎥", 180000, sort=4)
    item(c, "방수처리", "우레탄 2회", "㎡", 35000, sort=5)
    item(c, "되메우기", "다짐포함", "㎥", 8000, sort=6)

    # 철골공사
    c = cat(arch, "철골공사", 3)
    item(c, "H빔 기둥 설치", "설치비", "ton", 350000, sort=1)
    item(c, "H빔 보 설치", "설치비", "ton", 300000, sort=2)
    item(c, "브레이싱", "L형강", "개소", 80000, sort=3)
    item(c, "베이스플레이트", "앵커포함", "개소", 150000, sort=4)
    item(c, "용접비", "", "식", 500000, sort=5)

    # ── H빔 (중량 기반)
    c_hbeam = cat(arch, "H빔", 4)
    HBEAM_PRICE = 1100  # 원/kg
    hbeam_specs = [
        ("H100×100×6×8",   17.2),
        ("H125×125×6.5×9", 23.8),
        ("H150×150×7×10",  31.5),
        ("H175×175×7.5×11",40.4),
        ("H200×200×8×12",  50.5),
        ("H200×100×5.5×8", 21.3),
        ("H250×250×9×14",  72.4),
        ("H250×125×6×9",   29.6),
        ("H300×300×10×15", 94.5),
        ("H300×150×6.5×9", 36.7),
        ("H350×350×12×19", 137.0),
        ("H350×175×7×11",  49.6),
        ("H400×400×13×21", 172.0),
        ("H400×200×8×13",  66.0),
        ("H450×450×14×23", 212.0),
        ("H450×200×9×14",  76.5),
        ("H500×500×16×28", 278.0),
        ("H500×200×10×16", 89.7),
        ("H600×200×11×17", 106.0),
        ("H700×300×13×24", 185.0),
        ("H800×300×14×26", 210.0),
        ("H900×300×16×28", 243.0),
    ]
    for i, (spec, uw) in enumerate(hbeam_specs):
        item(c_hbeam, spec, spec, "kg", HBEAM_PRICE,
             supplier="인천 빔업체", unit_weight=uw,
             is_weight_based=True, sort=i+1)

    # ── 각파이프 (중량 기반)
    c_pipe = cat(arch, "각파이프", 5)
    PIPE_PRICE = 950  # 원/kg
    pipe_specs = [
        ("50×50×2.3T",   3.36),
        ("75×75×2.3T",   4.98),
        ("75×75×3.2T",   6.75),
        ("100×100×2.3T", 6.60),
        ("100×100×3.2T", 9.39),
        ("100×50×2.3T",  4.92),
        ("125×75×3.2T",  8.98),
        ("150×100×3.2T", 11.90),
    ]
    for i, (spec, uw) in enumerate(pipe_specs):
        item(c_pipe, spec, spec, "kg", PIPE_PRICE,
             unit_weight=uw, is_weight_based=True, sort=i+1)

    # 판넬공사
    c = cat(arch, "판넬공사", 6)
    SAEROEM = "새롬패널(주) 파주"
    panel_data = [
        ("EPS 벽체판넬 50T",   18000),
        ("EPS 벽체판넬 75T",   21000),
        ("EPS 벽체판넬 100T",  24000),
        ("EPS 지붕판넬 50T",   20000),
        ("EPS 지붕판넬 75T",   23000),
        ("EPS 지붕판넬 100T",  27000),
        ("준불연 판넬 100T",   32000),
        ("난연 판넬 100T",     30000),
        ("그라스울 판넬 100T", 38000),
        ("메탈판넬",           45000),
        ("징크 판넬",          55000),
    ]
    for i, (name, price) in enumerate(panel_data):
        item(c, name, "", "M", price, supplier=SAEROEM, sort=i+1)

    # 지붕공사
    c = cat(arch, "지붕공사", 7)
    item(c, "채광창", "투명 PC", "㎡", 85000, sort=1)
    item(c, "지붕 방수", "우레탄 2회", "㎡", 40000, sort=2)
    item(c, "지붕 단열재", "비드법 100T", "㎡", 22000, sort=3)

    # 후레싱
    c = cat(arch, "후레싱", 8)
    flashing_data = [
        ("일반 후레싱",    12000),
        ("용마루 후레싱",  15000),
        ("물받이 후레싱",  18000),
        ("코너 후레싱",    14000),
        ("창틀 마감 후레싱", 13000),
        ("외부코너 후레싱", 14000),
        ("내부코너 후레싱", 12000),
        ("처마 후레싱",    13000),
        ("박공 후레싱",    14000),
        ("마감 후레싱",    12000),
        ("주문 후레싱",    20000),
    ]
    for i, (name, price) in enumerate(flashing_data):
        item(c, name, "", "M", price, supplier=SAEROEM, sort=i+1)

    # 벽체공사
    c = cat(arch, "벽체공사", 9)
    item(c, "블록쌓기", "190×190×390", "㎡", 45000, sort=1)
    item(c, "석고보드", "9.5T", "㎡", 18000, sort=2)
    item(c, "경량벽체", "100T", "㎡", 55000, sort=3)
    item(c, "타일 붙이기", "외부 타일", "㎡", 65000, sort=4)

    # 창호공사
    c = cat(arch, "창호공사", 10)
    item(c, "알루미늄 창호", "3중유리", "㎡", 180000, sort=1)
    item(c, "샷시 창문", "단창", "㎡", 120000, sort=2)
    item(c, "방화문", "1.5T", "개소", 350000, sort=3)
    item(c, "셔터도어", "전동", "개소", 1200000, sort=4)
    item(c, "미닫이문", "알루미늄", "개소", 450000, sort=5)

    # 내장공사
    c = cat(arch, "내장공사", 11)
    item(c, "도장공사", "내부 에멀젼", "㎡", 15000, sort=1)
    item(c, "바닥 에폭시", "2회", "㎡", 25000, sort=2)
    item(c, "바닥 타일", "300×300", "㎡", 55000, sort=3)
    item(c, "천장 텍스", "", "㎡", 20000, sort=4)
    item(c, "화장실 공사", "변기·세면대 포함", "개소", 2500000, sort=5)

    # 설비공사
    c = cat(arch, "설비공사", 12)
    item(c, "급수배관", "PVC", "m", 25000, sort=1)
    item(c, "배수배관", "PVC", "m", 20000, sort=2)
    item(c, "에어컨 배관", "", "개소", 150000, sort=3)
    item(c, "소화기 설치", "3.3kg", "개", 35000, sort=4)

    # 전기공사
    c = cat(arch, "전기공사", 13)
    item(c, "전기 인입", "3상 220V", "식", 1500000, sort=1)
    item(c, "분전반", "12회로", "개", 350000, sort=2)
    item(c, "콘센트", "2구", "개", 25000, sort=3)
    item(c, "형광등", "LED 50W", "개", 45000, sort=4)
    item(c, "전선관 배관", "CD관", "m", 8000, sort=5)

    # 건축 철거
    c = cat(arch, "철거공사", 14)
    arch_demolish = [
        ("판넬 철거", "벽체·지붕", "㎡", 8000),
        ("지붕 판넬 철거", "", "㎡", 10000),
        ("벽체 판넬 철거", "", "㎡", 7000),
        ("후레싱 철거", "", "m", 3000),
        ("H빔 철거", "절단 포함", "ton", 150000),
        ("철골 철거", "", "ton", 130000),
        ("C형강 철거", "", "ton", 120000),
        ("각파이프 철거", "", "ton", 110000),
        ("샷시 철거", "", "㎡", 25000),
        ("창호 철거", "", "㎡", 30000),
        ("문 철거", "", "개소", 50000),
        ("천막 철거", "", "㎡", 5000),
        ("석고보드 철거", "", "㎡", 12000),
        ("천장재 철거", "", "㎡", 10000),
        ("경량벽체 철거", "", "㎡", 20000),
        ("타일 철거", "", "㎡", 25000),
        ("바닥 철거", "", "㎡", 30000),
        ("콘크리트 철거", "브레이커", "㎡", 45000),
        ("폐기물 상차", "", "㎥", 30000),
        ("폐기물 운반", "5톤", "회", 250000),
        ("폐기물 처리", "순환골재 외", "ton", 45000),
        ("고철 회수 공제", "", "ton", -100000),
        ("인력 철거", "", "인", 180000),
        ("장비 철거", "굴삭기", "일", 600000),
        ("고소작업 / 스카이", "22m", "일", 800000),
        ("사다리차", "15m", "일", 250000),
        ("굴삭기", "0.6㎥", "일", 500000),
        ("브레이커", "중형", "일", 600000),
        ("절단 작업", "다이아몬드", "m", 30000),
        ("용접 해체", "", "개소", 50000),
        ("비계 / 작업발판", "", "㎡", 15000),
        ("현장 정리 및 청소", "", "식", 300000),
    ]
    for i, (name, spec, unit, price) in enumerate(arch_demolish):
        item(c, name, spec, unit, price, sort=i+1)

    # ════════════════════════════════════════════
    # 토목 카테고리 & 품목
    # ════════════════════════════════════════════

    # 토공사
    c = cat(civil, "토공사", 1)
    item(c, "터파기", "굴삭기 0.6㎥", "㎥", 12000, sort=1)
    item(c, "잔토처리", "현장 외 반출", "㎥", 18000, sort=2)
    item(c, "되메우기", "다짐포함", "㎥", 8000, sort=3)
    item(c, "성토", "양질토", "㎥", 15000, sort=4)
    item(c, "다짐", "로드롤러", "㎥", 6000, sort=5)
    item(c, "절토", "", "㎥", 10000, sort=6)

    # 흙막이
    c = cat(civil, "흙막이공사", 2)
    item(c, "H-PILE 흙막이", "H200", "m", 85000, sort=1)
    item(c, "토류판", "목재", "㎡", 25000, sort=2)
    item(c, "버팀대 설치", "H빔", "m", 45000, sort=3)
    item(c, "흙막이 철거", "", "식", 300000, sort=4)

    # 배수공사
    c = cat(civil, "배수공사", 3)
    item(c, "우수관 D200", "흄관", "m", 35000, sort=1)
    item(c, "우수관 D300", "흄관", "m", 50000, sort=2)
    item(c, "우수관 D400", "흄관", "m", 70000, sort=3)
    item(c, "우수관 D500", "흄관", "m", 95000, sort=4)
    item(c, "오수관 D200", "VLP관", "m", 30000, sort=5)
    item(c, "오수관 D300", "VLP관", "m", 45000, sort=6)
    item(c, "우수받이 설치", "", "개소", 150000, sort=7)
    item(c, "맨홀 1호", "원형 콘크리트", "개소", 650000, sort=8)
    item(c, "맨홀 2호", "원형 콘크리트", "개소", 850000, sort=9)
    item(c, "집수정", "1000×1000", "개소", 500000, sort=10)

    # 측구공사
    c = cat(civil, "측구·경계석공사", 4)
    item(c, "U형 측구 300×300", "", "m", 55000, sort=1)
    item(c, "U형 측구 400×400", "", "m", 75000, sort=2)
    item(c, "경계석", "화강석 150×300", "m", 35000, sort=3)
    item(c, "연석", "콘크리트", "m", 28000, sort=4)
    item(c, "절토측구", "", "m", 30000, sort=5)

    # 콘크리트공사
    c = cat(civil, "콘크리트공사", 5)
    item(c, "콘크리트 타설", "24MPa 레미콘", "㎥", 130000, sort=1)
    item(c, "콘크리트 타설", "27MPa 레미콘", "㎥", 140000, sort=2)
    item(c, "무근콘크리트", "18MPa", "㎥", 110000, sort=3)
    item(c, "콘크리트 양생", "", "㎡", 5000, sort=4)
    item(c, "신축이음재", "아스팔트", "m", 8000, sort=5)

    # 철근공사
    c = cat(civil, "철근공사", 6)
    item(c, "철근 D10", "SD400", "ton", 850000, sort=1)
    item(c, "철근 D13", "SD400", "ton", 820000, sort=2)
    item(c, "철근 D16", "SD400", "ton", 810000, sort=3)
    item(c, "철근 D19", "SD400", "ton", 800000, sort=4)
    item(c, "철근 D22", "SD400", "ton", 795000, sort=5)
    item(c, "철근 D25", "SD400", "ton", 790000, sort=6)
    item(c, "가공·조립비", "", "ton", 120000, sort=7)

    # 거푸집공사
    c = cat(civil, "거푸집공사", 7)
    item(c, "합판 거푸집", "", "㎡", 35000, sort=1)
    item(c, "강재 거푸집", "", "㎡", 25000, sort=2)
    item(c, "거푸집 해체", "", "㎡", 8000, sort=3)
    item(c, "동바리 설치", "", "㎡", 15000, sort=4)

    # 구조물공사
    c = cat(civil, "구조물공사", 8)
    item(c, "옹벽 콘크리트", "H=2.0m", "m", 350000, sort=1)
    item(c, "옹벽 콘크리트", "H=3.0m", "m", 550000, sort=2)
    item(c, "L형 옹벽", "H=2.0m", "m", 450000, sort=3)
    item(c, "중력식 옹벽", "H=2.0m", "m", 520000, sort=4)
    item(c, "석축 쌓기", "잡석", "㎡", 85000, sort=5)
    item(c, "석축 쌓기", "호박돌", "㎡", 120000, sort=6)
    item(c, "블록 옹벽", "콘크리트 블록", "㎡", 65000, sort=7)

    # 포장공사
    c = cat(civil, "포장공사", 9)
    item(c, "아스팔트 포장", "t50mm", "㎡", 35000, sort=1)
    item(c, "아스팔트 포장", "t80mm", "㎡", 50000, sort=2)
    item(c, "콘크리트 포장", "t200mm", "㎡", 65000, sort=3)
    item(c, "보도블록 포장", "t60mm", "㎡", 45000, sort=4)
    item(c, "기층 보조기층", "t200mm", "㎡", 28000, sort=5)
    item(c, "쇄석 기층", "t150mm", "㎡", 22000, sort=6)

    # 부대토목공사
    c = cat(civil, "부대토목공사", 10)
    item(c, "가드레일 설치", "W-beam", "m", 55000, sort=1)
    item(c, "도로반사경", "", "개소", 180000, sort=2)
    item(c, "안전펜스", "1.2m", "m", 25000, sort=3)
    item(c, "볼라드", "화강석", "개소", 250000, sort=4)
    item(c, "지장물 이설", "", "식", 500000, sort=5)

    # 토목 철거
    c = cat(civil, "철거공사", 11)
    civil_demolish = [
        ("콘크리트 철거", "유압브레이커", "㎥", 85000),
        ("아스콘 철거", "노면 파쇄", "㎡", 15000),
        ("커팅", "다이아몬드 쏘", "m", 35000),
        ("코어", "콘크리트 천공", "개소", 50000),
        ("파쇄", "브레이커", "㎥", 60000),
        ("구조물 철거", "옹벽 등", "㎥", 95000),
        ("옹벽 철거", "", "㎥", 90000),
        ("측구 철거", "", "m", 25000),
        ("맨홀 철거", "", "개소", 350000),
        ("배관 철거", "흄관", "m", 18000),
        ("경계석 철거", "", "m", 8000),
        ("아스팔트 수거", "", "㎥", 45000),
        ("폐기물 상차", "건설폐기물", "㎥", 35000),
        ("폐기물 운반", "5톤", "회", 280000),
        ("폐기물 처리", "순환골재", "ton", 50000),
        ("굴삭기", "0.6㎥", "일", 500000),
        ("브레이커", "대형", "일", 700000),
        ("덤프트럭", "15톤", "일", 450000),
        ("현장 정리", "", "식", 350000),
    ]
    for i, (name, spec, unit, price) in enumerate(civil_demolish):
        item(c, name, spec, unit, price, sort=i+1)

    db.commit()
    print("✅ 시드 완료!")
    print("   관리자: admin / admin1234")
    print("   일반사용자: user / user1234")
