import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from '../lib/firebase';
import type { SavedSchedule } from '../lib/types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Firebase 초기화 및 연결 확인
    const { db, error: firebaseError } = getFirestore();
    
    if (firebaseError || !db) {
      return res.status(500).json({
        error: 'Firebase 초기화 오류',
        details: firebaseError?.message || 'Firebase 데이터베이스를 초기화할 수 없습니다.',
        hint: 'Vercel Dashboard > Settings > Environment Variables에서 FIREBASE_SERVICE_ACCOUNT 환경 변수를 확인하고, 재배포하세요.',
      });
    }
    
    const schedulesRef = db.collection('schedules');

    if (req.method === 'GET') {
      // 모든 저장된 근무표 목록 가져오기
      const snapshot = await schedulesRef
        .orderBy('createdAt', 'desc')
        .get();

      const schedules = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SavedSchedule[];

      res.status(200).json(schedules);
      return;
    }

    if (req.method === 'POST') {
      // 새로운 근무표 저장
      const scheduleData: Omit<SavedSchedule, 'id'> = req.body;

      if (!scheduleData.name || !scheduleData.year || !scheduleData.month) {
        res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
        return;
      }

      const newSchedule = {
        ...scheduleData,
        createdAt: scheduleData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Firebase Firestore에 문서 추가
      const docRef = await schedulesRef.add(newSchedule);

      res.status(201).json({
        ...newSchedule,
        id: docRef.id,
      });
      return;
    }

    res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  } catch (error) {
    console.error('API 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    // Firebase 초기화 오류인지 확인
    if (errorMessage.includes('Firebase') || errorMessage.includes('환경 변수')) {
      res.status(500).json({ 
        error: 'Firebase 연결 오류',
        details: errorMessage,
        hint: 'FIREBASE_SERVICE_ACCOUNT 환경 변수가 올바르게 설정되었는지 확인하세요. Vercel Dashboard > Settings > Environment Variables에서 확인하세요.'
      });
    } else {
      res.status(500).json({ 
        error: '서버 오류가 발생했습니다.',
        details: errorMessage
      });
    }
  }
}

