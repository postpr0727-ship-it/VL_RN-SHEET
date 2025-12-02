import admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let initializationError: Error | null = null;
let isInitializing = false;

// Firebase Admin 초기화 (환경 변수에서 서비스 계정 정보 가져오기)
function initializeFirebase(): { db: admin.firestore.Firestore; error: null } | { db: null; error: Error } {
  // 이미 초기화되었으면 반환
  if (db) {
    return { db, error: null };
  }

  // 이미 오류가 있었으면 반환
  if (initializationError) {
    return { db: null, error: initializationError };
  }

  // 초기화 중이면 오류 반환
  if (isInitializing) {
    return { 
      db: null, 
      error: new Error('Firebase 초기화가 진행 중입니다. 잠시 후 다시 시도하세요.') 
    };
  }

  try {
    isInitializing = true;

    // 이미 앱이 초기화되어 있으면
    if (admin.apps.length > 0) {
      try {
        db = admin.firestore();
        isInitializing = false;
        return { db, error: null };
      } catch (err) {
        const error = new Error(`Firestore 초기화 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
        initializationError = error;
        isInitializing = false;
        return { db: null, error };
      }
    }

    // 방법 1: 환경 변수에 JSON 형태로 저장된 경우
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount && serviceAccount.trim() !== '') {
      try {
        // JSON 문자열을 파싱
        let serviceAccountJson: any;
        try {
          serviceAccountJson = typeof serviceAccount === 'string' 
            ? JSON.parse(serviceAccount)
            : serviceAccount;
        } catch (parseErr) {
          throw new Error(`JSON 파싱 실패: ${parseErr instanceof Error ? parseErr.message : '알 수 없는 오류'}`);
        }

        // 필수 필드 확인
        if (!serviceAccountJson.project_id || !serviceAccountJson.private_key || !serviceAccountJson.client_email) {
          throw new Error('서비스 계정 JSON에 필수 필드(project_id, private_key, client_email)가 없습니다.');
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountJson),
        });
        db = admin.firestore();
        isInitializing = false;
        return { db, error: null };
      } catch (parseError) {
        const error = new Error(
          `Firebase 서비스 계정 설정 오류: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`
        );
        initializationError = error;
        isInitializing = false;
        console.error('Firebase 초기화 상세 오류:', parseError);
        return { db: null, error };
      }
    }
    
    // 방법 2: 환경 변수에 개별 필드로 저장된 경우
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (projectId && privateKey && clientEmail) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        db = admin.firestore();
        isInitializing = false;
        return { db, error: null };
      } catch (certError) {
        const error = new Error(`Firebase 인증서 오류: ${certError instanceof Error ? certError.message : '알 수 없는 오류'}`);
        initializationError = error;
        isInitializing = false;
        console.error('Firebase 인증서 오류 상세:', certError);
        return { db: null, error };
      }
    }
    
    // 환경 변수가 없는 경우
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim() !== '';
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    
    const error = new Error(
      `Firebase 환경 변수가 설정되지 않았습니다.\n` +
      `- FIREBASE_SERVICE_ACCOUNT: ${hasServiceAccount ? '있음 (비어있을 수 있음)' : '없음'}\n` +
      `- FIREBASE_PROJECT_ID: ${hasProjectId ? '있음' : '없음'}\n` +
      `- FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '있음' : '없음'}\n` +
      `- FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '있음' : '없음'}\n\n` +
      `해결 방법:\n` +
      `1. Firebase Console에서 서비스 계정 키 JSON 파일 다운로드\n` +
      `2. Vercel Dashboard > Settings > Environment Variables\n` +
      `3. FIREBASE_SERVICE_ACCOUNT 키에 JSON 전체 내용 붙여넣기\n` +
      `4. 재배포`
    );
    initializationError = error;
    isInitializing = false;
    console.error('Firebase 환경 변수 상태:', {
      FIREBASE_SERVICE_ACCOUNT: hasServiceAccount ? '설정됨 (길이: ' + process.env.FIREBASE_SERVICE_ACCOUNT?.length + ')' : '없음',
      FIREBASE_PROJECT_ID: hasProjectId ? '설정됨' : '없음',
      FIREBASE_PRIVATE_KEY: hasPrivateKey ? '설정됨' : '없음',
      FIREBASE_CLIENT_EMAIL: hasClientEmail ? '설정됨' : '없음',
    });
    return { db: null, error };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('알 수 없는 Firebase 초기화 오류');
    initializationError = err;
    isInitializing = false;
    console.error('Firebase 초기화 예외:', err);
    return { db: null, error: err };
  }
}

// Firebase 연결 가져오기 (지연 초기화)
export function getFirestore(): { db: admin.firestore.Firestore; error: null } | { db: null; error: Error } {
  return initializeFirebase();
}

// 기존 코드 호환성을 위한 export (오류 처리 포함)
export const db = (() => {
  const result = initializeFirebase();
  if (result.error) {
    // 오류가 있으면 더미 객체 반환 (실제 사용 시 오류 발생)
    return null as any;
  }
  return result.db;
})();

