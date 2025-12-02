# 🔄 Vercel 환경 변수 업데이트 가이드

환경 변수가 이미 존재하는 경우, 기존 값을 업데이트해야 합니다.

## 📋 단계별 업데이트 방법

### 1단계: Vercel Dashboard 접속

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 로그인 (GitHub 계정)
3. 프로젝트 목록에서 **"VL_RN-SHEET"** 또는 해당 프로젝트 선택

### 2단계: Environment Variables 메뉴로 이동

1. 상단 메뉴에서 **"Settings"** 클릭
2. 왼쪽 메뉴에서 **"Environment Variables"** 클릭

### 3단계: 기존 환경 변수 찾기

1. 환경 변수 목록에서 **`FIREBASE_SERVICE_ACCOUNT`** 찾기
   - 검색창을 사용하면 빠르게 찾을 수 있습니다
   - 목록에 표시되어야 합니다

### 4단계: 기존 환경 변수 편집 또는 삭제 후 재생성

#### 방법 A: 편집하기 (추천)

1. `FIREBASE_SERVICE_ACCOUNT` 항목의 오른쪽 끝에 있는 **연필 아이콘 ✏️** 또는 **"Edit"** 버튼 클릭
2. **Value** 필드에 기존 내용이 표시됨
3. 기존 내용을 **모두 선택** (Ctrl+A / Cmd+A) 후 **삭제**
4. Firebase 서비스 계정 키 JSON 파일 전체 내용 붙여넣기
   - JSON 파일 전체 내용 (중괄호 `{` `}` 포함)
5. **"Save"** 또는 **"저장"** 버튼 클릭

#### 방법 B: 삭제 후 재생성

1. `FIREBASE_SERVICE_ACCOUNT` 항목의 오른쪽 끝에 있는 **휴지통 아이콘 🗑️** 또는 **"Delete"** 버튼 클릭
2. 삭제 확인 대화상자에서 **"Delete"** 클릭
3. **"Add New"** 버튼 클릭
4. 새 환경 변수 추가:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Firebase 서비스 계정 키 JSON 파일 전체 내용
   - **Environment**: Production, Preview, Development 모두 체크
5. **"Save"** 클릭

### 5단계: Firebase 서비스 계정 키 확인

만약 JSON 파일을 다시 다운로드해야 한다면:

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. ⚙️ **프로젝트 설정** > **서비스 계정** 탭
4. **"새 비공개 키 생성"** 버튼 클릭
5. JSON 파일 다운로드
6. 텍스트 에디터로 열고 **전체 내용 복사** (중괄호 포함)

### 6단계: 재배포 (매우 중요!)

환경 변수를 변경한 후 **반드시 재배포**해야 합니다!

1. Vercel Dashboard 상단 메뉴에서 **"Deployments"** 클릭
2. 가장 최근 배포 항목 찾기 (목록 가장 위)
3. 배포 항목의 오른쪽 끝에 있는 **"⋯"** (점 3개) 메뉴 클릭
4. 드롭다운에서 **"Redeploy"** 선택
5. 재배포 확인 창에서:
   - "Use existing Build Cache" 체크박스는 그대로 두기
   - **"Redeploy"** 버튼 클릭
6. 배포 진행 상황 확인:
   - Status가 "Building..." 또는 "Deploying..."으로 변경됨
   - 배포 완료 대기 (약 2-3분)
7. 배포 완료 확인:
   - Status가 **"Ready"** (초록색)로 변경되면 완료

### 7단계: 확인

배포 완료 후:

1. 브라우저에서 다음 URL 접속:
   ```
   https://vl-rn-sheet.vercel.app/api/debug-firebase
   ```

2. 결과 확인:
   - ✅ `"firebase": { "initialized": true }` → 성공!
   - ❌ 오류 메시지 → 오류 메시지를 확인하고 다시 시도

## ⚠️ 주의사항

- JSON 파일을 복사할 때 **중괄호 `{` `}` 포함해서 전체**를 복사해야 합니다
- 환경 변수 값을 변경한 후 **반드시 재배포**해야 변경사항이 적용됩니다
- 재배포는 약 2-3분이 소요됩니다

## ❓ 여전히 문제가 있으면

1. `/api/debug-firebase` URL에서 표시된 오류 메시지 확인
2. Vercel Dashboard > Deployments > 최근 배포 > Logs에서 오류 확인
3. 오류 메시지를 알려주시면 정확히 해결해드리겠습니다!

