# Vercel 재배포 가이드

환경 변수를 추가하거나 수정한 후에는 **반드시 재배포**해야 변경사항이 적용됩니다.

## 🔄 재배포가 필요한 경우

- ✅ 새로운 환경 변수를 추가한 경우
- ✅ 기존 환경 변수를 수정한 경우
- ✅ 환경 변수를 삭제한 경우

## 📋 재배포 방법

### 방법 1: Deployments 탭에서 재배포 (가장 쉬움) ⭐

1. **Vercel Dashboard 접속**
   - [https://vercel.com/dashboard](https://vercel.com/dashboard)

2. **프로젝트 선택**
   - 목록에서 "VL_RN-SHEET" 또는 해당 프로젝트 클릭

3. **Deployments 탭으로 이동**
   - 상단 메뉴에서 **"Deployments"** 클릭
   - 또는 왼쪽 사이드바에서 "Deployments" 선택

4. **가장 최근 배포 찾기**
   - 목록 가장 위에 있는 배포 항목
   - 예: "main @ abc1234" 같은 형식

5. **재배포 메뉴 열기**
   - 배포 항목의 오른쪽 끝에 있는 **"⋯"** (점 3개) 클릭
   - 또는 배포 항목에 마우스를 올리면 나타나는 메뉴 버튼

6. **Redeploy 선택**
   - 드롭다운 메뉴에서 **"Redeploy"** 클릭

7. **재배포 확인**
   - "Redeploy Deployment?" 확인 창이 나타남
   - **"Use existing Build Cache"** 체크박스는 그대로 두기 (체크 유지)
   - **"Redeploy"** 버튼 클릭

8. **배포 완료 대기**
   - 배포 상태가 "Building..." 또는 "Deploying..."으로 변경
   - 약 2-3분 정도 소요
   - Status가 **"Ready"** (초록색)로 변경되면 완료

### 방법 2: 프로젝트 페이지에서 재배포

1. **프로젝트 페이지로 이동**
   - Vercel Dashboard에서 프로젝트 선택

2. **상단 메뉴 클릭**
   - 오른쪽 상단에 있는 **"⋯"** (점 3개) 메뉴 클릭

3. **Redeploy 선택**
   - 드롭다운 메뉴에서 **"Redeploy"** 선택

4. **위의 방법 1의 7-8단계와 동일**

### 방법 3: Git 푸시로 재배포

GitHub에 푸시하면 자동으로 재배포됩니다:

```bash
# 빈 커밋 생성 후 푸시
git commit --allow-empty -m "환경 변수 업데이트 후 재배포"
git push origin main
```

또는 기존 파일을 수정하고 푸시:

```bash
# README 파일에 공백 추가 (또는 다른 작은 수정)
echo "" >> README.md
git add README.md
git commit -m "재배포 트리거"
git push origin main
```

## ✅ 재배포 완료 확인

재배포가 완료되었는지 확인하는 방법:

1. **Deployments 탭 확인**
   - 가장 최근 배포의 Status가 **"Ready"** (초록색)
   - 또는 "준비됨"으로 표시

2. **사이트 접속 테스트**
   - [https://vl-rn-sheet.vercel.app](https://vl-rn-sheet.vercel.app) 접속
   - 페이지가 정상적으로 로드되는지 확인

3. **Firebase 연결 테스트**
   - 근무표를 저장해보고 성공하는지 확인
   - 다른 브라우저에서 불러오기가 작동하는지 확인

## ⏱️ 재배포 소요 시간

- 일반적으로 **2-3분** 정도 소요
- 빌드가 복잡한 경우 최대 **5분**까지 걸릴 수 있음

## ❓ 문제 해결

### 재배포가 실패하는 경우

1. **오류 메시지 확인**
   - Deployments 탭에서 실패한 배포 클릭
   - "Build Logs" 또는 "Functions Logs" 확인

2. **일반적인 오류**
   - **Build Error**: 코드에 오류가 있을 수 있음
   - **Environment Variable Error**: 환경 변수 형식이 잘못됨
   - **Timeout**: 빌드 시간이 너무 오래 걸림

3. **해결 방법**
   - 오류 메시지를 확인하고 수정
   - 다시 재배포 시도

### 재배포 후에도 변경사항이 적용되지 않는 경우

1. **브라우저 캐시 삭제**
   - Ctrl+Shift+Delete (Windows) 또는 Cmd+Shift+Delete (Mac)
   - 캐시 삭제 후 페이지 새로고침

2. **하드 리로드**
   - Ctrl+F5 (Windows) 또는 Cmd+Shift+R (Mac)

3. **재배포가 완료되었는지 확인**
   - Deployments 탭에서 Status가 "Ready"인지 확인

## 💡 팁

- 환경 변수를 여러 개 추가할 때는 **모두 추가한 후 한 번만 재배포**해도 됩니다
- 재배포 중에는 사이트가 일시적으로 느려질 수 있습니다
- 재배포는 이전 배포에 영향을 주지 않으므로 안전합니다

---

**다음 단계**: 재배포가 완료되면 [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)의 5단계로 넘어가세요! 🚀

