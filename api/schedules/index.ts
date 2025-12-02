import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb';
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
    const { db } = await connectToDatabase();
    const collection = db.collection<SavedSchedule>('schedules');

    if (req.method === 'GET') {
      // 모든 저장된 근무표 목록 가져오기
      const schedules = await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      // MongoDB _id를 id로 변환 (기존 id가 없으면 _id 사용)
      const schedulesFormatted = schedules.map(({ _id, ...schedule }) => ({
        ...schedule,
        id: schedule.id || _id?.toString() || '',
      }));

      res.status(200).json(schedulesFormatted);
      return;
    }

    if (req.method === 'POST') {
      // 새로운 근무표 저장
      const scheduleData: Omit<SavedSchedule, '_id'> = req.body;

      if (!scheduleData.name || !scheduleData.year || !scheduleData.month) {
        res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
        return;
      }

      const newSchedule: SavedSchedule = {
        ...scheduleData,
        createdAt: scheduleData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await collection.insertOne(newSchedule);

      // MongoDB _id를 id로 포함 (기존 id가 없으면 _id 사용)
      res.status(201).json({
        ...newSchedule,
        id: newSchedule.id || result.insertedId.toString(),
        _id: result.insertedId.toString(),
      });
      return;
    }

    res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
}

