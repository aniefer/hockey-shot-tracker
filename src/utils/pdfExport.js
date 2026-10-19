import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const EXPORT_SCALE = 1.5;
const JPEG_QUALITY = 0.8;
const MIN_JPEG_QUALITY = 0.5;
const MAX_IMAGE_BYTES = 950 * 1024;

function encodeJpeg(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality);
}

function dataUrlBytes(dataUrl) {
  const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
  return Math.floor((base64Length * 3) / 4);
}

// Lowers JPEG quality first, then resolution, until the image fits the size budget.
function fitImageToBudget(canvas) {
  let quality = JPEG_QUALITY;
  let imgData = encodeJpeg(canvas, quality);
  while (dataUrlBytes(imgData) > MAX_IMAGE_BYTES && quality > MIN_JPEG_QUALITY) {
    quality = Math.max(MIN_JPEG_QUALITY, quality - 0.1);
    imgData = encodeJpeg(canvas, quality);
  }
  if (dataUrlBytes(imgData) <= MAX_IMAGE_BYTES) return imgData;

  // Image bytes scale roughly with pixel count, so shrink each side by the square root of the ratio.
  const ratio = Math.sqrt(MAX_IMAGE_BYTES / dataUrlBytes(imgData)) * 0.95;
  const scaled = document.createElement('canvas');
  scaled.width = Math.floor(canvas.width * ratio);
  scaled.height = Math.floor(canvas.height * ratio);
  const ctx = scaled.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, scaled.width, scaled.height);
  ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  return encodeJpeg(scaled, quality);
}

export async function exportToPdf(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: EXPORT_SCALE,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = fitImageToBudget(canvas);
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Use landscape if content is wider than tall
  const orientation = imgWidth > imgHeight ? 'l' : 'p';
  const pdf = new jsPDF(orientation, 'px', [imgWidth, imgHeight]);
  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  pdf.save(filename);
}
