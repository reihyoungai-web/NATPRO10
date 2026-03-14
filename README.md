# ASNP NATPRO10 Event Game 🍊

> **ASNP NATPRO10 in JEJU Island** — 돌하르방 플랫폼 점프 게임

## 🎮 게임 방법

- **TAP / 클릭 / 스페이스바** → 돌하르방 점프 (더블점프 가능)
- **🍊 한라봉** 수집 → +10점
- **🐢 거북이 / 🐙 문어** 접촉 → 게임 오버
- 플랫폼 사이 간격에 빠지면 게임 오버

## 🌊 배경 요소

- 제주도 한라산 + 백록담 호수
- 바다에서 뛰어오르는 돌고래
- 3레이어 흐르는 구름

## 📥 기능

- 이메일 입력 후 게임 시작
- 게임 종료 후 점수 자동 저장
- TOP 10 랭킹 표출
- **EXCEL(CSV) 저장** 버튼으로 전체 결과 다운로드

---

## 🚀 GitHub Pages 배포 방법

1. 이 저장소를 GitHub에 push
2. **Settings → Pages → Source: Deploy from a branch → main / root**
3. 저장 후 `https://{username}.github.io/{repository-name}/` 접속

> ⚠️ 점수는 각 브라우저의 `localStorage`에 저장됩니다.  
> 기기가 달라지면 랭킹이 공유되지 않습니다.

---

## 📁 파일 구조

```
/
├── index.html      ← 게임 전체 (HTML + CSS + JS 통합)
└── README.md
```

## 🛠️ 기술 스택

- **Vanilla JS** (프레임워크 없음)
- **HTML5 Canvas** 기반 게임 엔진
- **Web Audio API** 8비트 효과음
- **localStorage** 점수 저장
- **Google Fonts** (Press Start 2P, Orbitron)
