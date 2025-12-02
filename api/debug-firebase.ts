import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method === 'GET') {
      // 환경 변수 상태 확인 (민감 정보는 제외)
      const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
      const serviceAccountLength = process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0;
      const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
      const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
      const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;

      // JSON 파싱 테스트
      let jsonParseError: string | null = null;
      let jsonFields: { [key: string]: boolean } = {};
      
      if (hasServiceAccount) {
        try {
          const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
          jsonFields = {
            project_id: !!parsed.project_id,
            private_key: !!parsed.private_key,
            client_email: !!parsed.client_email,
            type: !!parsed.type,
          };
        } catch (err) {
          jsonParseError = err instanceof Error ? err.message : '알 수 없는 JSON 파싱 오류';
        }
      }

      // Firebase 초기화 테스트
      let firebaseInitError: string | null = null;
      let firebaseInitSuccess = false;
      
      try {
        const { getFirestore } = await import('./lib/firebase.js');
        const { db, error } = getFirestore();
        
        if (error) {
          firebaseInitError = error.message;
        } else if (db) {
          firebaseInitSuccess = true;
          // 연결 테스트
          try {
            await db.collection('_debug').limit(1).get();
          } catch (testErr) {
            firebaseInitError = `초기화 성공, 연결 테스트 실패: ${testErr instanceof Error ? testErr.message : '알 수 없는 오류'}`;
          }
        }
      } catch (err) {
        firebaseInitError = err instanceof Error ? err.message : '알 수 없는 Firebase 초기화 오류';
      }

      return res.status(200).json({
        environment: {
          FIREBASE_SERVICE_ACCOUNT: {
            exists: hasServiceAccount,
            length: serviceAccountLength,
            isEmpty: serviceAccountLength === 0,
            jsonParseError: jsonParseError || null,
            jsonFields: hasServiceAccount ? jsonFields : null,
          },
          FIREBASE_PROJECT_ID: {
            exists: hasProjectId,
          },
          FIREBASE_PRIVATE_KEY: {
            exists: hasPrivateKey,
            length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
          },
          FIREBASE_CLIENT_EMAIL: {
            exists: hasClientEmail,
          },
        },
        firebase: {
          initialized: firebaseInitSuccess,
          error: firebaseInitError || null,
        },
        recommendations: getRecommendations({
          hasServiceAccount,
          serviceAccountLength,
          jsonParseError,
          jsonFields,
          firebaseInitError,
          firebaseInitSuccess,
        }),
      });
    }

    res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  } catch (error) {
    return res.status(500).json({
      error: '디버그 엔드포인트 오류',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

function getRecommendations(info: {
  hasServiceAccount: boolean;
  serviceAccountLength: number;
  jsonParseError: string | null;
  jsonFields: { [key: string]: boolean };
  firebaseInitError: string | null;
  firebaseInitSuccess: boolean;
}): string[] {
  const recommendations: string[] = [];

  if (!info.hasServiceAccount) {
    recommendations.push('❌ FIREBASE_SERVICE_ACCOUNT 환경 변수가 없습니다.');
    recommendations.push('   → Vercel Dashboard > Settings > Environment Variables에서 추가하세요.');
    return recommendations;
  }

  if (info.serviceAccountLength === 0) {
    recommendations.push('❌ FIREBASE_SERVICE_ACCOUNT 환경 변수가 비어있습니다.');
    recommendations.push('   → JSON 전체 내용을 복사해서 붙여넣으세요.');
    return recommendations;
  }

  if (info.jsonParseError) {
    recommendations.push(`❌ JSON 파싱 오류: ${info.jsonParseError}`);
    recommendations.push('   → JSON 파일이 올바른 형식인지 확인하세요.');
    recommendations.push('   → 중괄호 { } 포함해서 전체를 복사했는지 확인하세요.');
    return recommendations;
  }

  if (!info.jsonFields.project_id) {
    recommendations.push('❌ JSON에 project_id 필드가 없습니다.');
  }
  if (!info.jsonFields.private_key) {
    recommendations.push('❌ JSON에 private_key 필드가 없습니다.');
  }
  if (!info.jsonFields.client_email) {
    recommendations.push('❌ JSON에 client_email 필드가 없습니다.');
  }

  if (info.firebaseInitError) {
    recommendations.push(`❌ Firebase 초기화 오류: ${info.firebaseInitError}`);
    recommendations.push('   → Firebase Console에서 서비스 계정 키를 다시 다운로드하세요.');
    recommendations.push('   → Vercel에서 환경 변수를 삭제하고 다시 추가한 후 재배포하세요.');
  }

  if (info.firebaseInitSuccess) {
    recommendations.push('✅ Firebase가 정상적으로 초기화되었습니다!');
  }

  if (recommendations.length === 0) {
    recommendations.push('⚠️ 모든 설정이 완료되었지만 Firebase 초기화에 실패했습니다.');
    recommendations.push('   → Vercel 로그를 확인하세요: Vercel Dashboard > Deployments > 최근 배포 > Logs');
  }

  return recommendations;
}
