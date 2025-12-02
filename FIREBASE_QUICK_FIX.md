# 🔥 Firebase 설정 빠른 해결 가이드

"어느 웹에서든 저장된 파일을 볼 수 있게" 하려면 Firebase 설정이 필요합니다.

## ⚡ 빠른 해결 (5분)

### 1단계: Firebase 서비스 계정 키 확인

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. ⚙️ **"프로젝트 설정"** → **"서비스 계정"** 탭
4. **"새 비공개 키 생성"** 버튼 클릭
5. JSON 파일 다운로드
6. **JSON 파일을 메모장이나 텍스트 에디터로 열기**
7. **전체 내용 복사** (중괄호 { } 포함해서 전체)

### 2단계: Vercel 환경 변수 확인 및 수정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. `FIREBASE_SERVICE_ACCOUNT` 찾기
5. **있으면**: Value 클릭해서 내용 확인
6. **없으면**: 새로 추가

**환경 변수 설정:**
- **Key**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: 1단계에서 복사한 JSON 전체 내용
  - 중괄호 `{` `}` 포함해서 전체 붙여넣기
  - 따옴표도 그대로 포함
- **Environment**: Production, Preview, Development 모두 체크
- **Save** 클릭

### 3단계: 재배포 (매우 중요!)

1. **Deployments** 탭 클릭
2. 가장 최근 배포 항목 찾기
3. 오른쪽 끝 **"⋯"** (점 3개) 메뉴 클릭
4. **"Redeploy"** 선택
5. **"Redeploy"** 버튼 클릭
6. 배포 완료 대기 (약 2-3분)

### 4단계: 연결 확인

1. 배포 완료 후 (Status: Ready)
2. 브라우저에서 다음 URL 접속:
   ```
   https://vl-rn-sheet.vercel.app/api/health
   ```

**정상이면:**
```json
{
  "status": "ok",
  "firebase": "connected"
}
```

**오류면:**
오류 메시지를 확인하세요. 일반적인 오류:
- `Firebase 환경 변수가 설정되지 않았습니다` → 환경 변수 확인
- `JSON 파싱 오류` → JSON 형식 확인
- `Firestore 연결 실패` → Firestore 데이터베이스 생성 확인

## 🎯 완료 후 확인

1. 크롬에서 근무표 저장
2. 사파리에서 "불러오기" 클릭
3. 저장한 근무표가 보이면 성공! ✅

## ❓ 여전히 안 되면

오류 메시지를 알려주시면 정확히 해결해드리겠습니다.

