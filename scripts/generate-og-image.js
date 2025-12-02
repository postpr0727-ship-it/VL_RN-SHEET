import fs from 'fs';
import { createCanvas } from 'canvas';

// Canvas 생성 (1200x630)
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 배경 그라디언트
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#fef3c7');
gradient.addColorStop(0.5, '#f5f5f4');
gradient.addColorStop(1, '#fef3c7');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// 간호사 이모지
ctx.font = '200px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('👩‍⚕️', width / 2, height / 2 - 120);

// 제목
ctx.fillStyle = '#292524';
ctx.font = 'bold 72px Arial';
ctx.textAlign = 'center';
ctx.fillText('VL 레지던스', width / 2, height / 2 + 50);
ctx.fillText('건강관리센터', width / 2, height / 2 + 140);

// 부제목
ctx.fillStyle = '#78716c';
ctx.font = '300 42px Arial';
ctx.fillText('간호사 근무표', width / 2, height / 2 + 220);

// PNG로 저장
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/og-image.png', buffer);
console.log('✅ og-image.png 파일이 생성되었습니다!');



