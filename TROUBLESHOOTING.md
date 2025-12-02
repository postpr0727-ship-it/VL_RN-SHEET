# 🔧 Firebase 연결 문제 해결 가이드

"500: INTERNAL_SERVER_ERROR" 오류가 계속 발생하는 경우, 다음을 확인하세요.

## 🚨 현재 오류

Serverless Function이 크래시되고 있습니다. 이는 보통 Firebase 초기화 오류 때문입니다.

## 🔍 1단계: Vercel 로그 확인 (가장 중요!)

정확한 오류 메시지를 확인하려면:

1. **Vercel Dashboard 접속**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - 프로젝트 선택

2. **Functions 또는 Deployments 탭**
   - Functions 탭 또는 Deployments 탭 클릭
   - `api/health` 함수 클릭
   - **"Logs"** 또는 **"View Logs"** 클릭

3. **오류 메시지 확인**
   - 빨간색으로 표시된 오류 찾기
   - 오류 메시지 전체 복사

## 🛠️ 2단계: 환경 변수 확인

### 방법 A: Vercel Dashboard에서 확인

1. **Settings > Environment Variables**
2. `FIREBASE_SERVICE_ACCOUNT` 찾기
3. Value 확인:
   - **비어있으면**: 문제입니다! 아래 방법으로 설정하세요
   - **있으면**: 내용 확인 (JSON 형식이어야 함)

### 방법 B: API로 확인 (재배포 후)

재배포 후 브라우저에서 다음 URL 접속:
```
https://vl-rn-sheet.vercel.app/api/health
```

오류 메시지가 표시됩니다.

## ✅ 3단계: Firebase 설정 다시 하기

### A. Firebase 서비스 계정 키 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (없으면 생성)
3. ⚙️ **프로젝트 설정** > **서비스 계정** 탭
4. **"새 비공개 키 생성"** 클릭
5. JSON 파일 다운로드

### B. JSON 파일 내용 확인

1. 다운로드한 JSON 파일을 텍스트 에디터로 열기
2. 전체 내용 확인 (예시):
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

3. **전체 내용 복사** (중괄호 `{` `}` 포함)

### C. Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) > 프로젝트 > Settings
2. **Environment Variables** 클릭
3. `FIREBASE_SERVICE_ACCOUNT` 찾기 또는 **"Add New"** 클릭
4. 설정:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: B단계에서 복사한 JSON 전체 내용 붙여넣기
   - **Environment**: Production, Preview, Development 모두 체크
5. **Save** 클릭

### D. 재배포 (매우 중요!)

1. **Deployments** 탭 클릭
2. 가장 최근 배포 항목 찾기
3. 오른쪽 끝 **"⋯"** 메뉴 클릭
4. **"Redeploy"** 선택
5. **"Redeploy"** 버튼 클릭
6. 배포 완료 대기 (약 2-3분, Status가 "Ready"가 될 때까지)

## 🎯 4단계: 확인

배포 완료 후:

1. 브라우저에서 접속:
   ```
   https://vl-rn-sheet.vercel.app/api/health
   ```

2. 결과 확인:
   - ✅ `"firebase": "connected"` → 성공!
   - ❌ 오류 메시지 → 오류 메시지를 복사해서 알려주세요

## ❓ 여전히 안 되면

1. **Vercel 로그의 오류 메시지** 복사
2. **`/api/health` 응답 내용** 복사
3. 위 정보를 알려주시면 정확히 해결해드리겠습니다!

## 📋 체크리스트

진행 전에 확인:

- [ ] Firebase 프로젝트가 생성되었는가?
- [ ] Firestore 데이터베이스가 생성되었는가?
- [ ] 서비스 계정 키 JSON 파일을 다운로드했는가?
- [ ] Vercel에 `FIREBASE_SERVICE_ACCOUNT` 환경 변수가 있는가?
- [ ] 환경 변수 값이 비어있지 않은가?
- [ ] JSON 전체 내용(중괄호 포함)을 붙여넣었는가?
- [ ] 환경 변수 저장 후 재배포를 했는가?
- [ ] 재배포가 완료되었는가? (Status: Ready)

---

**다음 단계**: Vercel 로그를 확인하거나 `/api/health` URL로 오류 메시지를 확인하세요!

