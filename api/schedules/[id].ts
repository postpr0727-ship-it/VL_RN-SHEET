import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb';
import type { SavedSchedule } from '../lib/types';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'ID가 필요합니다.' });
    return;
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<SavedSchedule>('schedules');

    // ObjectId 또는 일반 id로 검색
    let query: { _id?: ObjectId; id?: string } = {};
    try {
      // MongoDB ObjectId 형식인지 확인
      query._id = new ObjectId(id);
    } catch {
      // 일반 id로 검색
      query.id = id;
    }

    if (req.method === 'GET') {
      // 특정 근무표 가져오기
      const schedule = await collection.findOne(query);

      if (!schedule) {
        res.status(404).json({ error: '근무표를 찾을 수 없습니다.' });
        return;
      }

      // MongoDB _id를 id로 변환
      const formattedSchedule = {
        ...schedule,
        id: schedule.id || schedule._id?.toString() || id,
      };
      const { _id, ...scheduleWithoutMongoId } = formattedSchedule;
      res.status(200).json(scheduleWithoutMongoId);
      return;
    }

    if (req.method === 'DELETE') {
      // 근무표 삭제
      const result = await collection.deleteOne(query);

      if (result.deletedCount === 0) {
        res.status(404).json({ error: '근무표를 찾을 수 없습니다.' });
        return;
      }

      res.status(200).json({ message: '근무표가 삭제되었습니다.', deletedId: id });
      return;
    }

    if (req.method === 'PUT') {
      // 근무표 업데이트
      const updateData: Partial<SavedSchedule> = req.body;
      
      const updateDoc = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      const result = await collection.updateOne(
        query,
        { $set: updateDoc }
      );

      if (result.matchedCount === 0) {
        res.status(404).json({ error: '근무표를 찾을 수 없습니다.' });
        return;
      }

      const updated = await collection.findOne(query);
      if (!updated) {
        res.status(500).json({ error: '업데이트된 근무표를 가져올 수 없습니다.' });
        return;
      }

      // MongoDB _id를 id로 변환
      const formattedSchedule = {
        ...updated,
        id: updated.id || updated._id?.toString() || id,
      };
      const { _id, ...scheduleWithoutMongoId } = formattedSchedule;
      res.status(200).json(scheduleWithoutMongoId);
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

