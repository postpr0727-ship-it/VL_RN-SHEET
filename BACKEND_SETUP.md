# 백엔드 서버 설정 가이드

이 프로젝트는 MongoDB Atlas를 데이터베이스로 사용하며, Vercel Serverless Functions를 통해 API를 제공합니다.

## 1. MongoDB Atlas 설정

### 1.1 MongoDB Atlas 계정 생성

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)에 접속하여 회원가입
2. 무료 티어 선택 (M0 Free Tier)

### 1.2 클러스터 생성

1. "Build a Database" 클릭
2. "FREE" (M0) 선택
3. 클라우드 제공자 및 리전 선택 (가까운 지역 권장)
4. 클러스터 이름 지정 (예: `nurse-schedule-cluster`)
5. "Create" 클릭

### 1.3 데이터베이스 사용자 생성

1. "Database Access" 메뉴로 이동
2. "Add New Database User" 클릭
3. Authentication Method: "Password"
4. 사용자 이름과 비밀번호 설정 (기록해두세요!)
5. User Privileges: "Atlas admin" 또는 "Read and write to any database"
6. "Add User" 클릭

### 1.4 네트워크 액세스 설정

1. "Network Access" 메뉴로 이동
2. "Add IP Address" 클릭
3. "Allow Access from Anywhere" 클릭 (0.0.0.0/0) 또는 특정 IP 입력
   - Vercel에서 실행되므로 0.0.0.0/0 권장
4. "Confirm" 클릭

### 1.5 연결 문자열 가져오기

1. "Database" 메뉴로 이동
2. "Connect" 버튼 클릭
3. "Connect your application" 선택
4. Driver: "Node.js", Version: 최신 버전
5. 연결 문자열 복사
   - 형식: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. 연결 문자열에서 `<username>`과 `<password>`를 실제 사용자 정보로 변경

## 2. 환경 변수 설정

### 2.1 로컬 개발 환경 (.env 파일)

프로젝트 루트에 `.env` 파일 생성:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=nurse-schedule
VITE_API_BASE_URL=http://localhost:5173/api
```

**주의**: `.env` 파일은 `.gitignore`에 추가되어 있어 Git에 커밋되지 않습니다.

### 2.2 Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속
2. 프로젝트 선택
3. "Settings" > "Environment Variables" 메뉴로 이동
4. 다음 환경 변수 추가:

   - **MONGODB_URI**
     - Value: MongoDB Atlas 연결 문자열 (위에서 복사한 것)
   
   - **MONGODB_DB_NAME**
     - Value: `nurse-schedule`

5. "Save" 클릭

## 3. API 엔드포인트

### 3.1 근무표 목록 가져오기

```
GET /api/schedules
```

응답:
```json
[
  {
    "id": "2025-12-1234567890",
    "name": "2025년 12월 근무표",
    "year": 2025,
    "month": 12,
    "schedule": [...],
    "vacations": [...],
    "manualEdits": {...},
    "nurseLabels": {...},
    "createdAt": "2025-12-02T12:00:00.000Z"
  }
]
```

### 3.2 특정 근무표 가져오기

```
GET /api/schedules/:id
```

### 3.3 근무표 저장

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
  "nurseLabels": {...},
  "nurseConfigs": [...]
}
```

### 3.4 근무표 삭제

```
DELETE /api/schedules/:id
```

## 4. 로컬 개발 환경 테스트

### 4.1 Vercel CLI 설치

```bash
npm install -g vercel
```

### 4.2 로컬에서 API 실행

```bash
vercel dev
```

이제 프론트엔드와 API가 함께 실행됩니다.

## 5. 배포

1. 코드를 GitHub에 푸시
2. Vercel이 자동으로 배포 (환경 변수는 Vercel Dashboard에서 설정)

## 6. 문제 해결

### MongoDB 연결 실패

- 연결 문자열의 사용자 이름과 비밀번호가 올바른지 확인
- 네트워크 액세스 설정에서 IP 주소가 허용되었는지 확인
- MongoDB Atlas 클러스터가 실행 중인지 확인

### API 404 오류

- `api/` 폴더가 프로젝트 루트에 있는지 확인
- Vercel이 API 폴더를 인식하는지 확인

### CORS 오류

- API 파일에서 CORS 헤더가 올바르게 설정되었는지 확인

## 7. 데이터 마이그레이션 (기존 localStorage 데이터)

기존에 localStorage에 저장된 데이터를 MongoDB로 마이그레이션하려면:

1. 브라우저 개발자 도구에서 localStorage 확인
2. `savedSchedules` 키의 데이터를 복사
3. API를 통해 POST 요청으로 데이터 저장

또는 백엔드에서 마이그레이션 스크립트를 작성할 수 있습니다.

