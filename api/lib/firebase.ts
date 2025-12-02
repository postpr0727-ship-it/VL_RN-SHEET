import admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let initializationError: Error | null = null;

// Firebase Admin 초기화 (환경 변수에서 서비스 계정 정보 가져오기)
function initializeFirebase(): { db: admin.firestore.Firestore; error: null } | { db: null; error: Error } {
  if (db) {
    return { db, error: null };
  }

  if (initializationError) {
    return { db: null, error: initializationError };
  }

  if (!admin.apps.length) {
    try {
      // 방법 1: 환경 변수에 JSON 형태로 저장된 경우
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (serviceAccount) {
        try {
          // JSON 문자열을 파싱
          const serviceAccountJson = typeof serviceAccount === 'string' 
            ? JSON.parse(serviceAccount)
            : serviceAccount;
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
          });
          db = admin.firestore();
          return { db, error: null };
        } catch (parseError) {
          const error = new Error(`Firebase 서비스 계정 JSON 파싱 오류: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`);
          initializationError = error;
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
          return { db, error: null };
        } catch (certError) {
          const error = new Error(`Firebase 인증서 오류: ${certError instanceof Error ? certError.message : '알 수 없는 오류'}`);
          initializationError = error;
          return { db: null, error };
        }
      }
      
      // 환경 변수 디버깅 정보 추가
      const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
      const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
      const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
      const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
      
      const error = new Error(
        `Firebase 환경 변수가 설정되지 않았습니다.\n` +
        `- FIREBASE_SERVICE_ACCOUNT: ${hasServiceAccount ? '있음' : '없음'}\n` +
        `- FIREBASE_PROJECT_ID: ${hasProjectId ? '있음' : '없음'}\n` +
        `- FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '있음' : '없음'}\n` +
        `- FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '있음' : '없음'}\n\n` +
        `해결 방법: Vercel Dashboard > Settings > Environment Variables에서 FIREBASE_SERVICE_ACCOUNT를 설정하고 재배포하세요.`
      );
      initializationError = error;
      console.error('Firebase 환경 변수 상태:', {
        FIREBASE_SERVICE_ACCOUNT: hasServiceAccount ? '설정됨' : '없음',
        FIREBASE_PROJECT_ID: hasProjectId ? '설정됨' : '없음',
        FIREBASE_PRIVATE_KEY: hasPrivateKey ? '설정됨' : '없음',
        FIREBASE_CLIENT_EMAIL: hasClientEmail ? '설정됨' : '없음',
      });
      return { db: null, error };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('알 수 없는 Firebase 초기화 오류');
      initializationError = err;
      console.error('Firebase 초기화 오류:', err);
      return { db: null, error: err };
    }
  }
  
  db = admin.firestore();
  return { db, error: null };
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

