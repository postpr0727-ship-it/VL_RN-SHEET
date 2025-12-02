# Firebase 연결 문제 디버깅 가이드

크롬에서 저장한 근무표가 사파리에서 보이지 않는 경우, Firebase 연결에 문제가 있을 수 있습니다.

## 🔍 문제 진단 방법

### 1단계: 브라우저 개발자 도구 확인

1. **크롬에서 개발자 도구 열기**
   - `F12` 키 누르기
   - 또는 우클릭 → "검사" 또는 "Inspect"

2. **Console 탭 확인**
   - 저장 버튼을 클릭한 후 Console 탭 확인
   - 다음 메시지가 보이는지 확인:
     - ✅ `✅ API 저장 성공:` → Firebase 연결 정상
     - ❌ `❌ API 저장 실패, localStorage로 fallback:` → Firebase 연결 실패

3. **Network 탭 확인**
   - Network 탭 열기
   - "불러오기" 버튼 클릭
   - `/api/schedules` 요청 찾기
   - 상태 코드 확인:
     - `200` → 정상
     - `500` → 서버 오류 (Firebase 연결 문제 가능)
     - `404` → API 엔드포인트 없음

### 2단계: API 연결 상태 확인

브라우저 주소창에 다음 URL 입력:
```
https://vl-rn-sheet.vercel.app/api/health
```

**정상 응답:**
```json
{
  "status": "ok",
  "firebase": "connected",
  "message": "Firebase Firestore가 정상적으로 연결되었습니다."
}
```

**오류 응답:**
```json
{
  "status": "error",
  "firebase": "not_connected",
  "message": "Firebase Firestore 연결에 실패했습니다.",
  "error": "...",
  "hint": "..."
}
```

### 3단계: Vercel 로그 확인

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. 상단 메뉴에서 **"Functions"** 또는 **"Deployments"** 클릭
4. 최근 배포의 **"Functions"** 또는 **"Logs"** 확인
5. Firebase 관련 오류 메시지 확인

## 🛠️ 일반적인 문제와 해결 방법

### 문제 1: "Firebase 환경 변수가 설정되지 않았습니다"

**원인**: Vercel에 환경 변수가 설정되지 않았거나 재배포가 안 됨

**해결 방법**:
1. Vercel Dashboard > Settings > Environment Variables 확인
2. `FIREBASE_SERVICE_ACCOUNT` 환경 변수가 있는지 확인
3. 환경 변수가 있다면 재배포:
   - Deployments 탭 > 최근 배포 > ⋯ 메뉴 > Redeploy

### 문제 2: "JSON 파싱 오류"

**원인**: 환경 변수에 저장된 JSON 형식이 잘못됨

**해결 방법**:
1. Firebase Console에서 서비스 계정 키 다시 생성
2. JSON 파일 전체 내용 복사 (중괄호 포함)
3. Vercel 환경 변수에 다시 붙여넣기
4. 재배포

### 문제 3: "Firestore 연결 실패"

**원인**: Firestore 데이터베이스가 생성되지 않았거나 권한 문제

**해결 방법**:
1. Firebase Console에서 Firestore Database 확인
2. 데이터베이스가 생성되어 있는지 확인
3. 서비스 계정 키가 올바른지 확인

### 문제 4: API가 404 오류 반환

**원인**: API 엔드포인트가 배포되지 않음

**해결 방법**:
1. Vercel Dashboard에서 최근 배포 확인
2. Functions 섹션에서 `api/schedules/index.ts`가 있는지 확인
3. 없다면 코드를 다시 푸시하고 재배포

## 🔧 수동 테스트 방법

### 브라우저 콘솔에서 직접 테스트

1. 개발자 도구(F12) 열기
2. Console 탭에서 다음 코드 실행:

```javascript
// API 연결 테스트
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log('API 상태:', data))
  .catch(err => console.error('API 오류:', err));

// 근무표 목록 조회 테스트
fetch('/api/schedules')
  .then(res => res.json())
  .then(data => console.log('저장된 근무표:', data))
  .catch(err => console.error('조회 오류:', err));
```

### 근무표 저장 테스트

```javascript
// 테스트 데이터로 저장 시도
fetch('/api/schedules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '테스트 근무표',
    year: 2025,
    month: 12,
    schedule: [],
    vacations: [],
    manualEdits: {},
    nurseLabels: {}
  })
})
  .then(res => res.json())
  .then(data => console.log('저장 성공:', data))
  .catch(err => console.error('저장 오류:', err));
```

## 📋 체크리스트

다음을 모두 확인하세요:

- [ ] Firebase 프로젝트가 생성되었는가?
- [ ] Firestore 데이터베이스가 생성되었는가?
- [ ] 서비스 계정 키가 생성되었는가?
- [ ] Vercel에 `FIREBASE_SERVICE_ACCOUNT` 환경 변수가 설정되었는가?
- [ ] 환경 변수 설정 후 재배포를 했는가?
- [ ] 재배포가 완료되었는가? (Status: Ready)
- [ ] `/api/health` 엔드포인트가 정상 응답하는가?
- [ ] 브라우저 콘솔에 오류가 없는가?

## 💡 추가 도움

위의 방법으로도 해결되지 않으면:

1. 브라우저 콘솔의 오류 메시지 전체 복사
2. Vercel Functions 로그의 오류 메시지 복사
3. `/api/health` 응답 내용 복사
4. 위 정보를 함께 알려주시면 더 정확한 진단이 가능합니다.

