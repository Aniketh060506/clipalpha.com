// src/utils/steganography.ts

const MAGIC_HEADER = "PASTIT";
const MAGIC_BYTES = new TextEncoder().encode(MAGIC_HEADER);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load image at " + src));
    img.src = src;
  });
}

/**
 * Returns max capacity in BYTES
 * Rules: 4 channels per pixel (RGBA). We skip Alpha. So 3 channels per pixel.
 * 1 channel holds 1 bit = 3 bits per pixel.
 * Payload bytes = (Pixels * 3) / 8
 */
export function getStegoCapacityBytes(width: number, height: number): number {
  const pixels = width * height;
  const bits = pixels * 3;
  return Math.floor(bits / 8) - MAGIC_BYTES.length - 4; // Subtract header & length
}

/**
 * Encodes a secret string (UTF-8) into an image via LSB.
 * Throws if the image is too small.
 */
export async function hideDataInImage(coverImageSrc: string, secretString: string): Promise<string> {
  const img = await loadImage(coverImageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelData = imgData.data;

  const payloadBytes = new TextEncoder().encode(secretString);
  const capacity = getStegoCapacityBytes(canvas.width, canvas.height);
  
  if (payloadBytes.length > capacity) {
    throw new Error(`Payload too large. Max: ${capacity} bytes, Got: ${payloadBytes.length} bytes.`);
  }

  // Build final byte array to encode: [MAGIC_HEADER] [4-byte length] [PAYLOAD]
  const fullPayload = new Uint8Array(MAGIC_BYTES.length + 4 + payloadBytes.length);
  fullPayload.set(MAGIC_BYTES, 0);
  
  // Create DataView to write 32-bit big-endian length
  const dv = new DataView(fullPayload.buffer);
  dv.setUint32(MAGIC_BYTES.length, payloadBytes.length, false); // false = big-endian
  
  fullPayload.set(payloadBytes, MAGIC_BYTES.length + 4);

  let dataIndex = 0;
  let bitIndex = 0;
  let pixelIndex = 0;

  while (dataIndex < fullPayload.length) {
    // Skip Alpha channel (RGBA)
    if (pixelIndex % 4 === 3) {
      pixelIndex++;
      continue;
    }

    const currentByte = fullPayload[dataIndex];
    const bitToHide = (currentByte >> (7 - bitIndex)) & 1;

    // Clear LSB of color channel and write our bit
    pixelData[pixelIndex] = (pixelData[pixelIndex] & ~1) | bitToHide;

    bitIndex++;
    if (bitIndex === 8) {
      bitIndex = 0;
      dataIndex++;
    }
    pixelIndex++;
  }

  ctx.putImageData(imgData, 0, 0);
  // PNG is strictly required for lossless LSB encoding
  return canvas.toDataURL("image/png");
}

/**
 * Decodes a secret string from an LSB-encoded image.
 * Returns null if no valid secret is found.
 */
export async function extractDataFromImage(stegoImageSrc: string): Promise<string | null> {
  const img = await loadImage(stegoImageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelData = imgData.data;

  const readBits = (numBits: number, startIndex: number): { bytes: Uint8Array, nextIndex: number } => {
    const bytes = new Uint8Array(Math.ceil(numBits / 8));
    let pixelIndex = startIndex;
    let byteIndex = 0;
    let bitIndex = 0;

    for (let i = 0; i < numBits; i++) {
       // Skip Alpha channel (RGBA)
       if (pixelIndex % 4 === 3) {
         pixelIndex++;
       }

       const lsb = pixelData[pixelIndex] & 1;
       bytes[byteIndex] |= (lsb << (7 - bitIndex));

       bitIndex++;
       if (bitIndex === 8) {
         bitIndex = 0;
         byteIndex++;
       }
       pixelIndex++;
    }

    return { bytes, nextIndex: pixelIndex };
  };

  // 1. Read Magic Header
  const headerBits = MAGIC_BYTES.length * 8;
  const headerExtraction = readBits(headerBits, 0);
  
  const extractedHeader = new TextDecoder().decode(headerExtraction.bytes);
  if (extractedHeader !== MAGIC_HEADER) {
    return null; // Not a valid PASTIT steganography image
  }

  // 2. Read length
  const lengthExtraction = readBits(32, headerExtraction.nextIndex);
  const dv = new DataView(lengthExtraction.bytes.buffer);
  const payloadLength = dv.getUint32(0, false);

  if (payloadLength <= 0 || payloadLength > getStegoCapacityBytes(canvas.width, canvas.height)) {
    return null; // Corrupted length
  }

  // 3. Read payload
  const payloadExtraction = readBits(payloadLength * 8, lengthExtraction.nextIndex);
  return new TextDecoder().decode(payloadExtraction.bytes);
}
