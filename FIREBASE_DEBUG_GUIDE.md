# 🔧 Firebase 설정 문제 진단 가이드

Firebase 설정을 완료했는데도 작동하지 않는 경우, 이 가이드로 정확한 문제를 찾을 수 있습니다.

## 🚨 1단계: 디버그 도구로 문제 확인

### 방법 A: 브라우저에서 확인 (가장 쉬움)

1. 브라우저에서 다음 URL 접속:
   ```
   https://vl-rn-sheet.vercel.app/api/debug-firebase
   ```

2. 표시된 정보 확인:
   - ✅ 초록색 표시 → 정상
   - ❌ 빨간색 표시 → 문제 발견!

3. **"recommendations"** 섹션에서 문제 해결 방법 확인

### 방법 B: Vercel 로그 확인

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Deployments** 탭 클릭
4. 가장 최근 배포 클릭
5. **Functions** 탭 또는 **Logs** 탭 클릭
6. 빨간색 오류 메시지 찾기

---

## 🔍 2단계: 일반적인 문제와 해결 방법

### 문제 1: "FIREBASE_SERVICE_ACCOUNT 환경 변수가 없습니다"

**원인**: 환경 변수가 설정되지 않았거나 재배포가 안 됨

**해결**:
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 > **Settings** > **Environment Variables**
3. `FIREBASE_SERVICE_ACCOUNT` 찾기
4. 없으면: [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) 4단계 참고
5. 있으면: 아래 "재배포" 섹션 참고

---

### 문제 2: "JSON 파싱 실패"

**원인**: JSON 파일을 잘못 복사했거나 형식이 잘못됨

**해결**:
1. Firebase Console에서 서비스 계정 키를 다시 다운로드
   - [Firebase Console](https://console.firebase.google.com/)
   - 프로젝트 선택
   - ⚙️ **프로젝트 설정** > **서비스 계정** 탭
   - **"새 비공개 키 생성"** 클릭
   - JSON 파일 다운로드
2. 다운로드한 JSON 파일을 텍스트 에디터로 열기
3. **전체 내용 복사** (중괄호 `{` `}` 포함)
4. Vercel Dashboard > Settings > Environment Variables
5. `FIREBASE_SERVICE_ACCOUNT` 편집 또는 삭제 후 재생성
6. 복사한 JSON 전체 내용 붙여넣기
7. **재배포** (아래 참고)

---

### 문제 3: "JSON에 필수 필드가 없습니다"

**원인**: JSON 파일이 불완전하거나 일부만 복사됨

**확인해야 할 필드**:
- `project_id`: Firebase 프로젝트 ID
- `private_key`: 개인 키 (-----BEGIN PRIVATE KEY-----로 시작)
- `client_email`: 서비스 계정 이메일

**해결**:
1. JSON 파일을 다시 열고 전체 내용이 복사되었는지 확인
2. `{` 로 시작하고 `}` 로 끝나는지 확인
3. 중간에 잘린 부분이 없는지 확인
4. Vercel 환경 변수에 다시 붙여넣기
5. **재배포**

---

### 문제 4: "Firebase 초기화 성공, 연결 테스트 실패"

**원인**: Firestore 데이터베이스가 생성되지 않았거나 권한 문제

**해결**:
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
4. 데이터베이스가 없으면: "데이터베이스 만들기" 클릭
   - **"프로덕션 모드에서 시작"** 선택
   - 위치 선택 (예: `asia-northeast3` (서울))
   - "사용 설정" 클릭
5. 데이터베이스가 있으면: 규칙 확인
   - "규칙" 탭 클릭
   - 임시로 모든 접근 허용:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if true;
         }
       }
     }
     ```
   - "게시" 클릭

---

### 문제 5: "환경 변수는 있는데 초기화 실패"

**원인**: 환경 변수가 재배포되지 않았거나 다른 오류

**해결**:
1. Vercel 로그에서 정확한 오류 메시지 확인
2. 환경 변수를 삭제하고 다시 추가
3. **재배포** (아래 참고)

---

## 🔄 재배포 방법 (매우 중요!)

환경 변수를 변경한 후 **반드시 재배포**해야 합니다!

### 방법 1: Deployments에서 재배포 (추천)

1. Vercel Dashboard > **Deployments** 탭
2. 가장 최근 배포 항목 찾기
3. 오른쪽 끝 **"⋯"** (점 3개) 메뉴 클릭
4. **"Redeploy"** 선택
5. "Use existing Build Cache" 체크 유지
6. **"Redeploy"** 버튼 클릭
7. 배포 완료 대기 (2-3분, Status가 "Ready"가 될 때까지)

### 방법 2: Git 푸시로 재배포

터미널에서:
```bash
git commit --allow-empty -m "Firebase 환경 변수 재배포"
git push origin main
```

---

## ✅ 3단계: 연결 확인

재배포 완료 후:

1. 브라우저에서 접속:
   ```
   https://vl-rn-sheet.vercel.app/api/debug-firebase
   ```

2. 결과 확인:
   - `"firebase": { "initialized": true }` → ✅ 성공!
   - `"recommendations"`에 ✅ 표시만 있으면 완료

3. 실제 사용 테스트:
   - 근무표 저장 테스트
   - 다른 브라우저에서 불러오기 테스트

---

## 🆘 여전히 안 되면

다음 정보를 알려주세요:

1. **디버그 정보**:
   - `https://vl-rn-sheet.vercel.app/api/debug-firebase` 접속
   - 표시된 JSON 내용 전체 복사

2. **Vercel 로그**:
   - Vercel Dashboard > Deployments > 최근 배포 > Logs
   - 빨간색 오류 메시지 복사

3. **환경 변수 상태**:
   - `FIREBASE_SERVICE_ACCOUNT`가 설정되어 있는지
   - Value 길이가 0보다 큰지

위 정보를 주시면 정확히 해결해드리겠습니다! 🚀

