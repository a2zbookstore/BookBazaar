import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { BookImporter, DetailedImportResult } from './bookImporter';

export interface ImageBundle {
  slot1?: Buffer; // imageUrl
  slot2?: Buffer; // imageUrl2
  slot3?: Buffer; // imageUrl3
}

export type ImageMap = Record<string, ImageBundle>; // keyed by ISBN

const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Magic bytes for allowed image types
const IMAGE_MAGIC: Array<{ bytes: number[]; offset: number }> = [
  { bytes: [0xff, 0xd8, 0xff], offset: 0 },           // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },     // PNG
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },     // WEBP (RIFF header)
];

function isValidImage(buffer: Buffer): boolean {
  for (const magic of IMAGE_MAGIC) {
    let match = true;
    for (let i = 0; i < magic.bytes.length; i++) {
      if (buffer[magic.offset + i] !== magic.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

function isSafeEntryName(entryName: string): boolean {
  // Reject path traversal attempts
  const normalized = path.normalize(entryName).replace(/\\/g, '/');
  return !normalized.includes('../') && !normalized.startsWith('/');
}

export interface ZipImportResult extends DetailedImportResult {
  imagesFromZip: number;
}

export class ZipImporter {
  static async importFromZip(zipFilePath: string): Promise<ZipImportResult> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bookimport-'));

    try {
      const zip = new AdmZip(zipFilePath);
      const entries = zip.getEntries();

      let excelEntry: AdmZip.IZipEntry | null = null;
      const imageMap: ImageMap = {};
      let imagesFromZip = 0;

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        const entryName = entry.entryName;

        // Security: reject path traversal
        if (!isSafeEntryName(entryName)) {
          console.warn(`Skipping unsafe ZIP entry: ${entryName}`);
          continue;
        }

        const baseName = path.basename(entryName);
        const ext = path.extname(baseName).toLowerCase();

        // Find the Excel file
        if (ext === '.xlsx' || ext === '.xls') {
          if (!excelEntry) {
            excelEntry = entry;
          }
          continue;
        }

        // Handle image files
        if (ALLOWED_IMAGE_EXTS.has(ext)) {
          const nameWithoutExt = path.basename(baseName, ext);

          // Determine ISBN and slot from filename
          // Patterns: {ISBN}.jpg  |  {ISBN}_2.jpg  |  {ISBN}_3.jpg
          let isbn: string;
          let slot: 1 | 2 | 3;

          const slotMatch = nameWithoutExt.match(/^(.+?)_([23])$/);
          if (slotMatch) {
            isbn = slotMatch[1];
            slot = parseInt(slotMatch[2]) as 2 | 3;
          } else {
            isbn = nameWithoutExt;
            slot = 1;
          }

          const buffer = entry.getData();

          // Validate image magic bytes
          if (!isValidImage(buffer)) {
            console.warn(`Skipping non-image file disguised as image: ${baseName}`);
            continue;
          }

          if (!imageMap[isbn]) {
            imageMap[isbn] = {};
          }

          if (slot === 1) imageMap[isbn].slot1 = buffer;
          else if (slot === 2) imageMap[isbn].slot2 = buffer;
          else if (slot === 3) imageMap[isbn].slot3 = buffer;

          imagesFromZip++;
        }
      }

      if (!excelEntry) {
        throw new Error('No Excel file (.xlsx or .xls) found in the ZIP');
      }

      // Extract Excel to temp directory
      const excelBuffer = excelEntry.getData();
      const excelExt = path.extname(excelEntry.entryName).toLowerCase();
      const excelPath = path.join(tempDir, `books${excelExt}`);
      fs.writeFileSync(excelPath, excelBuffer);

      // Run the import with the image map
      const result = await BookImporter.importFromZip(excelPath, imageMap);

      return {
        ...result,
        imagesFromZip,
        imagesFetched: result.imagesFetched ?? 0,
        imagesNone: result.imagesNone ?? 0,
      };
    } finally {
      // Always clean up temp directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to cleanup temp dir:', e);
      }
    }
  }
}
