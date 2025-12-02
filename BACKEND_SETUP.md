# 백엔드 서버 설정 가이드 (Firebase Firestore)

이 프로젝트는 **Firebase Firestore**를 데이터베이스로 사용하며, Vercel Serverless Functions를 통해 API를 제공합니다.

## 🚀 빠른 시작 (5분 안에 완료!)

### 1단계: Firebase 프로젝트 생성 (2분)

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. Google 계정으로 로그인
3. "프로젝트 추가" 클릭
4. 프로젝트 이름 입력 (예: `nurse-schedule`)
5. Google Analytics는 선택사항 (비활성화해도 됨)
6. "프로젝트 만들기" 클릭

### 2단계: Firestore 데이터베이스 생성 (1분)

1. Firebase Console에서 생성한 프로젝트 선택
2. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
3. "데이터베이스 만들기" 클릭
4. **"프로덕션 모드에서 시작"** 선택 (나중에 규칙 수정 가능)
5. 위치 선택 (가장 가까운 지역 선택, 예: `asia-northeast3` (서울))
6. "사용 설정" 클릭

### 3단계: 서비스 계정 키 생성 (2분)

1. Firebase Console 왼쪽 메뉴에서 ⚙️ **"프로젝트 설정"** 클릭
2. 상단 탭에서 **"서비스 계정"** 선택
3. "Firebase Admin SDK" 섹션에서 **"Node.js"** 선택
4. **"새 비공개 키 생성"** 버튼 클릭
5. JSON 파일이 자동으로 다운로드됨
6. **⚠️ 중요**: 이 JSON 파일을 안전하게 보관하세요!

### 4단계: 환경 변수 설정

#### 방법 A: JSON 전체를 환경 변수로 (추천)

1. 다운로드한 JSON 파일 내용을 모두 복사
2. Vercel Dashboard 접속:
   - [Vercel Dashboard](https://vercel.com/dashboard)
   - 프로젝트 선택
   - Settings > Environment Variables
3. 환경 변수 추가:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: JSON 파일 전체 내용을 붙여넣기 (중괄호 포함)
   - **Environment**: Production, Preview, Development 모두 선택
4. "Save" 클릭

#### 방법 B: 개별 필드로 분리 (선택사항)

JSON 파일에서 다음 값들을 찾아 개별 환경 변수로 추가:

- **FIREBASE_PROJECT_ID**: `project_id` 값
- **FIREBASE_PRIVATE_KEY**: `private_key` 값 (전체, 따옴표 포함)
- **FIREBASE_CLIENT_EMAIL**: `client_email` 값

### 5단계: Firestore 보안 규칙 설정 (선택사항)

현재는 모든 읽기/쓰기가 허용되어 있습니다. 필요시 보안 규칙을 설정하세요:

1. Firestore Database > "규칙" 탭
2. 기본 규칙:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 읽기/쓰기 허용 (개발용)
    match /{document=**} {
      allow read, write: if true;
    }
    
    // 또는 더 안전한 규칙 (인증 필요)
    // match /schedules/{scheduleId} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
```

## 📋 API 엔드포인트

### 근무표 목록 가져오기
```
GET /api/schedules
```

### 특정 근무표 가져오기
```
GET /api/schedules/:id
```

### 근무표 저장
```
POST /api/schedules
Content-Type: application/json

{
  "name": "2025년 12월 근무표",
  "year": 2025,
  "month": 12,
  "schedule": [...],
  "vacations": [...],
  "manualEdits": {...},
  "nurseLabels": {...}
}
```

### 근무표 삭제
```
DELETE /api/schedules/:id
```

### 근무표 업데이트
```
PUT /api/schedules/:id
Content-Type: application/json

{ ... }
```

## 🔧 로컬 개발 환경 테스트

### Vercel CLI 설치
```bash
npm install -g vercel
```

### 환경 변수 설정 (로컬)

프로젝트 루트에 `.env` 파일 생성:

```env
# 방법 A: JSON 전체
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}

# 방법 B: 개별 필드 (방법 A를 사용하지 않는 경우)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 로컬에서 API 실행
```bash
vercel dev
```

## 🚢 배포

1. 코드를 GitHub에 푸시
2. Vercel이 자동으로 배포 (환경 변수는 Vercel Dashboard에서 설정)

## ❓ 문제 해결

### Firebase 초기화 오류
- 환경 변수가 올바르게 설정되었는지 확인
- JSON 형식이 올바른지 확인 (따옴표, 중괄호 등)
- Vercel에서 환경 변수를 재배포 후 확인

### Firestore 연결 실패
- Firestore 데이터베이스가 생성되었는지 확인
- 서비스 계정 키가 올바른지 확인
- Firebase Console에서 프로젝트가 활성화되어 있는지 확인

### CORS 오류
- API 파일에서 CORS 헤더가 올바르게 설정되었는지 확인

## 💡 MongoDB Atlas와 비교

### Firebase Firestore 장점
- ✅ 설정이 매우 간단 (5분 안에 완료)
- ✅ 서비스 계정 키만 복사하면 끝
- ✅ 클라이언트에서 직접 접근 가능
- ✅ 실시간 동기화 지원
- ✅ 무료 티어가 넉넉함

### MongoDB Atlas 장점
- ✅ SQL과 유사한 쿼리 기능
- ✅ 복잡한 데이터 구조에 유리

**결론**: 간단한 근무표 저장/불러오기 용도에는 Firebase Firestore가 더 적합합니다! 🎉

## 📚 추가 리소스

- [Firebase 공식 문서](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Vercel 환경 변수 설정](https://vercel.com/docs/concepts/projects/environment-variables)
