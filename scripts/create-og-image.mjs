import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

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

// 텍스트 스타일
ctx.fillStyle = '#292524';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// 간호사 이모지 (큰 글씨로)
ctx.font = 'bold 180px Arial';
ctx.fillText('👩‍⚕️', width / 2, height / 2 - 100);

// 제목
ctx.fillStyle = '#292524';
ctx.font = '300 64px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
ctx.fillText('VL 레지던스', width / 2, height / 2 + 60);
ctx.fillText('건강관리센터', width / 2, height / 2 + 140);

// 부제목
ctx.fillStyle = '#78716c';
ctx.font = '300 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
ctx.fillText('간호사 근무표', width / 2, height / 2 + 220);

// PNG로 저장
const buffer = canvas.toBuffer('image/png');
const outputPath = join(publicDir, 'og-image.png');
fs.writeFileSync(outputPath, buffer);
console.log('✅ og-image.png 파일이 생성되었습니다!');
console.log(`📍 경로: ${outputPath}`);

