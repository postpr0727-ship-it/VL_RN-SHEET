# Vercel 로그 확인 가이드

Serverless Function 크래시 오류를 해결하려면 Vercel 로그를 확인해야 합니다.

## 🔍 Vercel 로그 확인 방법

### 방법 1: Vercel Dashboard에서 확인 (추천)

1. **Vercel Dashboard 접속**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)

2. **프로젝트 선택**
   - "VL_RN-SHEET" 또는 해당 프로젝트 클릭

3. **Functions 또는 Deployments 탭 선택**

   **옵션 A: Functions 탭**
   - 상단 메뉴에서 **"Functions"** 클릭
   - `api/health` 또는 `api/schedules/index` 클릭
   - **"Logs"** 또는 **"View Logs"** 클릭

   **옵션 B: Deployments 탭**
   - 상단 메뉴에서 **"Deployments"** 클릭
   - 가장 최근 배포 항목 클릭
   - **"Functions"** 섹션 찾기
   - `api/health` 또는 관련 함수 클릭
   - 로그 확인

4. **오류 메시지 확인**
   - 빨간색으로 표시된 오류 찾기
   - 오류 메시지 전체 복사

### 방법 2: Vercel CLI로 확인

터미널에서 다음 명령어 실행:

```bash
# Vercel CLI 설치 (아직 안 했다면)
npm install -g vercel

# 로그인
vercel login

# 프로젝트 디렉토리에서 로그 확인
vercel logs
```

## 📋 확인할 오류 유형

### 1. Firebase 초기화 오류

```
Firebase 환경 변수가 설정되지 않았습니다
```

**해결 방법:**
- Vercel Dashboard > Settings > Environment Variables
- `FIREBASE_SERVICE_ACCOUNT` 확인
- 없으면 추가하고 재배포

### 2. JSON 파싱 오류

```
Firebase 서비스 계정 JSON 파싱 오류
```

**해결 방법:**
- JSON 형식이 잘못됨
- Firebase Console에서 서비스 계정 키 다시 생성
- 전체 JSON 내용 복사 (중괄호 포함)
- Vercel 환경 변수에 다시 붙여넣기

### 3. Firestore 연결 오류

```
Firebase Firestore 연결에 실패했습니다
```

**해결 방법:**
- Firebase Console에서 Firestore 데이터베이스 생성 확인
- 서비스 계정 키가 올바른지 확인

### 4. 모듈 로드 오류

```
Cannot find module 'firebase-admin'
```

**해결 방법:**
- package.json에 firebase-admin이 있는지 확인
- 재배포

## 🛠️ 즉시 시도할 수 있는 해결 방법

### 1. 환경 변수 확인 및 재설정

1. **Firebase Console에서 서비스 계정 키 다시 생성**
   - Firebase Console > 프로젝트 설정 > 서비스 계정
   - "새 비공개 키 생성"
   - JSON 파일 다운로드

2. **Vercel 환경 변수 재설정**
   - Vercel Dashboard > Settings > Environment Variables
   - `FIREBASE_SERVICE_ACCOUNT` 찾기
   - **"Edit"** 클릭
   - JSON 파일 내용 전체 복사해서 붙여넣기
   - **중요**: 중괄호 `{` `}` 포함해서 전체
   - Save

3. **재배포**
   - Deployments > 최근 배포 > ⋯ 메뉴 > Redeploy

### 2. 빈 환경 변수 확인

환경 변수가 비어있거나 잘못되었을 수 있습니다:

1. Vercel Dashboard > Settings > Environment Variables
2. `FIREBASE_SERVICE_ACCOUNT` Value 확인
3. 비어있거나 짧으면 다시 설정

## 📝 오류 메시지 복사 방법

Vercel 로그에서 오류 메시지를 찾으면:

1. 오류 메시지 전체 선택
2. 복사 (Ctrl+C / Cmd+C)
3. 이곳에 붙여넣어서 알려주세요

정확한 오류 메시지를 알려주시면 더 정확한 해결책을 제공할 수 있습니다!

## 🆘 빠른 체크리스트

- [ ] Firebase 프로젝트가 생성되었는가?
- [ ] Firestore 데이터베이스가 생성되었는가?
- [ ] 서비스 계정 키가 생성되었는가?
- [ ] Vercel에 `FIREBASE_SERVICE_ACCOUNT` 환경 변수가 있는가?
- [ ] 환경 변수 값이 비어있지 않은가?
- [ ] 환경 변수 설정 후 재배포를 했는가?
- [ ] 재배포가 완료되었는가? (Status: Ready)

## 💡 다음 단계

Vercel 로그에서 오류 메시지를 찾아서 알려주세요. 그러면 정확한 해결책을 제공하겠습니다!

