# 🚨 Firebase 설정 문제 빠른 진단

## 즉시 확인하기

다음 URL을 브라우저에서 열어보세요:

```
https://vl-rn-sheet.vercel.app/api/debug-firebase
```

이 URL은 Firebase 설정 상태를 상세히 보여줍니다.

---

## 예상되는 문제와 해결책

### 1️⃣ 환경 변수가 없음
**증상**: `"FIREBASE_SERVICE_ACCOUNT": { "exists": false }`

**해결**:
- [Vercel Dashboard](https://vercel.com/dashboard) 접속
- 프로젝트 > Settings > Environment Variables
- `FIREBASE_SERVICE_ACCOUNT` 추가
- [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) 참고

---

### 2️⃣ JSON 파싱 오류
**증상**: `"jsonParseError": "..."`

**해결**:
1. Firebase Console에서 서비스 계정 키 다시 다운로드
2. JSON 파일 전체 내용 복사 (중괄호 포함)
3. Vercel 환경 변수에 다시 붙여넣기
4. 재배포

---

### 3️⃣ Firebase 초기화 실패
**증상**: `"firebase": { "initialized": false, "error": "..." }`

**해결**:
- 오류 메시지 확인
- Firestore 데이터베이스가 생성되었는지 확인
- 서비스 계정 키가 올바른지 확인

---

### 4️⃣ 재배포 안 함
**증상**: 환경 변수는 있는데 계속 실패

**해결**:
1. Vercel Dashboard > Deployments
2. 최근 배포 > ⋯ > Redeploy
3. 배포 완료 대기 (2-3분)

---

## 다음 단계

1. `/api/debug-firebase` URL에서 문제 확인
2. `FIREBASE_DEBUG_GUIDE.md` 파일에서 상세 해결 방법 확인
3. 여전히 안 되면 디버그 정보를 알려주세요

