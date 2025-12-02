# 🔥 Firebase 설정 완료 가이드

이 가이드는 Firebase를 처음부터 설정하는 단계별 가이드입니다. 약 5-10분이 소요됩니다.

## ✅ 체크리스트

각 단계를 완료한 후 체크박스를 표시하세요:

- [ ] 1단계: Firebase 프로젝트 생성
- [ ] 2단계: Firestore 데이터베이스 생성
- [ ] 3단계: 서비스 계정 키 생성
- [ ] 4단계: Vercel 환경 변수 설정
- [ ] 5단계: 연결 확인

---

## 1단계: Firebase 프로젝트 생성 (약 2분)

### 1.1 Firebase Console 접속

1. 브라우저에서 [Firebase Console](https://console.firebase.google.com/) 접속
2. Google 계정으로 로그인

### 1.2 새 프로젝트 생성

1. "프로젝트 추가" 또는 "Add project" 버튼 클릭
2. 프로젝트 이름 입력:
   - 예: `vl-nurse-schedule` 또는 `nurse-schedule`
   - 프로젝트 ID는 자동으로 생성됨
3. "계속" 또는 "Continue" 클릭
4. Google Analytics 설정:
   - **선택사항**: 원하시면 활성화, 아니면 비활성화해도 됨
   - 간호사 근무표에는 불필요하므로 비활성화 권장
5. "프로젝트 만들기" 또는 "Create project" 클릭
6. 프로젝트 생성 완료 대기 (약 30초)

✅ **완료 조건**: Firebase Console에 프로젝트가 표시됨

---

## 2단계: Firestore 데이터베이스 생성 (약 1분)

### 2.1 Firestore Database 메뉴로 이동

1. Firebase Console에서 방금 생성한 프로젝트 선택
2. 왼쪽 메뉴에서 **"Firestore Database"** 또는 **"Firestore"** 클릭
   - 🔍 찾기: "빌드(Build)" 섹션 아래에 있음

### 2.2 데이터베이스 생성

1. **"데이터베이스 만들기"** 또는 **"Create database"** 버튼 클릭
2. 보안 규칙 선택:
   - **"프로덕션 모드에서 시작"** 또는 **"Start in production mode"** 선택
   - ⚠️ 나중에 규칙을 수정할 수 있으므로 걱정하지 마세요
3. "다음" 또는 "Next" 클릭
4. 위치 선택:
   - **권장**: `asia-northeast3` (서울) 또는 `asia-northeast1` (도쿄)
   - 한국에서 가장 빠른 속도
   - 다른 지역을 선택해도 됨
5. **"사용 설정"** 또는 **"Enable"** 클릭
6. 데이터베이스 생성 완료 대기 (약 1분)

✅ **완료 조건**: Firestore Database 페이지가 열리고 빈 데이터베이스가 표시됨

---

## 3단계: 서비스 계정 키 생성 (약 2분)

### 3.1 프로젝트 설정으로 이동

1. Firebase Console 왼쪽 메뉴에서 ⚙️ **"프로젝트 설정"** 또는 **"Project settings"** 클릭
   - 🔍 찾기: 기어 아이콘(⚙️)이 있는 메뉴

### 3.2 서비스 계정 탭 선택

1. 상단 탭 메뉴에서 **"서비스 계정"** 또는 **"Service accounts"** 탭 클릭

### 3.3 Firebase Admin SDK 설정

1. "Firebase Admin SDK" 섹션 찾기
2. 언어 선택: **"Node.js"** 선택
3. **"새 비공개 키 생성"** 또는 **"Generate new private key"** 버튼 클릭
4. 경고 메시지 확인:
   - "비공개 키를 생성하시겠습니까?" 같은 메시지가 나옴
   - **"키 생성"** 또는 **"Generate key"** 클릭
5. JSON 파일이 자동으로 다운로드됨
   - 파일명: `your-project-name-firebase-adminsdk-xxxxx-xxxxx.json`

### 3.4 JSON 파일 열기

1. 다운로드된 JSON 파일을 텍스트 에디터로 열기
   - 메모장, VS Code, TextEdit 등 아무거나 사용 가능
2. 파일 내용을 **전체 복사** (Ctrl+A → Ctrl+C / Cmd+A → Cmd+C)
   - 전체 JSON 내용이 복사되어야 함
   - 중괄호 `{}` 포함해서 전체 복사

✅ **완료 조건**: JSON 파일 내용을 클립보드에 복사 완료

---

## 4단계: Vercel 환경 변수 설정 (약 2분)

### 4.1 Vercel Dashboard 접속

1. 브라우저에서 [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 로그인 (GitHub 계정으로 로그인되어 있어야 함)
3. 프로젝트 목록에서 **"VL_RN-SHEET"** 또는 해당 프로젝트 선택

### 4.2 Environment Variables 메뉴로 이동

1. 상단 메뉴에서 **"Settings"** 클릭
2. 왼쪽 메뉴에서 **"Environment Variables"** 클릭

### 4.3 환경 변수 추가

1. **"Add New"** 또는 **"새로 추가"** 버튼 클릭
2. 다음 정보 입력:
   - **Key (변수명)**: `FIREBASE_SERVICE_ACCOUNT`
     - 정확하게 입력해야 함 (대소문자 구분)
   - **Value (값)**: 
     - 3단계에서 복사한 JSON 파일 내용을 붙여넣기
     - 전체 JSON 내용 (중괄호 포함)
     - 예:
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
   - **Environment (환경)**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - 모두 체크 (3개 모두 선택)
3. **"Save"** 또는 **"저장"** 버튼 클릭

### 4.4 재배포 (중요!)

⚠️ **환경 변수를 추가한 후 반드시 재배포해야 합니다!**

#### 방법 1: Deployments 탭에서 재배포 (추천)

1. Vercel Dashboard 상단 메뉴에서 **"Deployments"** 클릭
   - 또는 왼쪽 사이드바에서 "Deployments" 선택
2. 가장 최근 배포 항목을 찾기
   - 목록 가장 위에 있는 배포
3. 배포 항목의 오른쪽 끝에 있는 **"⋯"** (점 3개) 메뉴 클릭
   - 또는 배포 항목에 마우스를 올리면 나타나는 메뉴 버튼
4. 드롭다운 메뉴에서 **"Redeploy"** 클릭
5. 재배포 확인 창이 나타남:
   - "Use existing Build Cache" 체크박스는 그대로 두기 (체크 유지)
   - **"Redeploy"** 버튼 클릭
6. 배포 진행 상황 확인:
   - 배포 상태가 "Building..." 또는 "Deploying..."으로 변경됨
   - 배포 완료 대기 (약 2-3분)
7. 배포 완료 확인:
   - Status가 **"Ready"** 또는 **"준비됨"**으로 변경되면 완료

✅ **완료 조건**: 새 배포의 Status가 "Ready" (초록색)

#### 방법 2: 프로젝트 페이지에서 재배포

1. Vercel Dashboard에서 프로젝트 페이지로 돌아가기
   - 상단에 프로젝트 이름이 표시된 페이지
2. 오른쪽 상단에 있는 **"⋯"** (점 3개) 메뉴 클릭
3. **"Redeploy"** 선택
4. 위의 방법 1의 5-7단계와 동일

#### 방법 3: Git 푸시로 재배포

GitHub에 빈 커밋을 푸시하면 자동으로 재배포됩니다:

```bash
git commit --allow-empty -m "환경 변수 업데이트 후 재배포"
git push origin main
```

⚠️ **주의**: 재배포가 완료될 때까지 약 2-3분 정도 기다려야 합니다.

✅ **완료 조건**: 새 배포가 완료되고 Status가 "Ready"

---

## 5단계: 연결 확인 (약 1분)

### 5.1 사이트 접속

1. 브라우저에서 사이트 접속: `https://vl-rn-sheet.vercel.app`
2. 페이지 새로고침 (F5 또는 Ctrl+R / Cmd+R)

### 5.2 근무표 저장 테스트

1. 근무표 생성 후 "💾 저장" 버튼 클릭
2. 이름 입력 후 저장
3. 저장 성공 메시지 확인

### 5.3 다른 브라우저에서 확인

1. 다른 브라우저(또는 다른 기기)에서 같은 사이트 접속
2. "📂 불러오기" 버튼 클릭
3. 저장한 근무표가 표시되는지 확인

✅ **완료 조건**: 다른 브라우저에서도 저장한 근무표가 보임

---

## 🎉 완료!

모든 단계를 완료하셨다면:
- ✅ 모든 브라우저에서 동일한 근무표를 볼 수 있습니다
- ✅ 모든 기기에서 동일한 근무표를 볼 수 있습니다
- ✅ 데이터가 Firebase에 안전하게 저장됩니다

---

## ❓ 문제 해결

### 문제: "API 요청 실패" 오류

**원인**: Firebase 환경 변수가 설정되지 않았거나 재배포가 안 됨

**해결 방법**:
1. Vercel Dashboard에서 환경 변수가 올바르게 설정되었는지 확인
2. 재배포를 완료했는지 확인
3. 브라우저를 새로고침

### 문제: JSON 파싱 오류

**원인**: JSON 파일을 잘못 복사했거나 따옴표가 누락됨

**해결 방법**:
1. JSON 파일을 다시 열고 전체 내용 복사
2. 중괄호 `{` `}` 포함해서 정확히 복사
3. Vercel 환경 변수에 다시 붙여넣기

### 문제: Firebase 연결 실패

**원인**: 서비스 계정 키가 잘못되었거나 Firestore가 생성되지 않음

**해결 방법**:
1. Firebase Console에서 Firestore Database가 생성되었는지 확인
2. 서비스 계정 키를 다시 생성
3. Vercel 환경 변수에 다시 입력

### 문제: 다른 브라우저에서 데이터가 안 보임

**원인**: 아직 localStorage에 저장되고 있음 (API가 작동하지 않음)

**해결 방법**:
1. 브라우저 개발자 도구(F12) 열기
2. Console 탭에서 오류 메시지 확인
3. Network 탭에서 `/api/schedules` 요청이 실패하는지 확인
4. 위의 문제 해결 방법 시도

---

## 📞 추가 도움이 필요하신가요?

문제가 해결되지 않으면:
1. 브라우저 개발자 도구(F12)의 Console 탭에서 오류 메시지 확인
2. 오류 메시지를 복사해서 알려주세요

---

**다음 단계**: 모든 브라우저와 기기에서 근무표를 자유롭게 저장하고 불러올 수 있습니다! 🎉

