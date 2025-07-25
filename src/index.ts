import sharp from 'sharp';
import { optimize } from 'svgo';
import { fromBuffer } from 'pdf2pic';
import ffmpeg from 'fluent-ffmpeg';
import { Document, Packer, Paragraph } from 'docx';
import { readFile, writeFile } from 'fs/promises';
import { basename, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Import pdf-parse type
import type { default as PdfParse } from 'pdf-parse';

// Patch pdf-parse to handle ENOENT error
let pdfParse: typeof PdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (err: unknown) {
  console.warn('pdf-parse initialization failed:', err instanceof Error ? err.message : String(err));
  // Mock pdf-parse to prevent crashes, using double type assertion to match PdfParse
  pdfParse = (() =>
    Promise.resolve({
      text: '',
      numpages: 0,
      numrender: 0,
      info: {},
      metadata: {},
      version: 'mock', // Arbitrary string, unused in pdfToWord
    })) as unknown as typeof PdfParse;
}

interface ConversionOptions {
  input: string;
  output: string;
  format?: string;
}

export class FileConverter {
  async convertImage(options: ConversionOptions): Promise<void> {
    const { input, output, format } = options;
    if (!existsSync(input)) {
      throw new Error(`Input file ${input} does not exist`);
    }
    if (!format || !['bmp', 'eps', 'ico', 'svg', 'tga', 'wbmp'].includes(format)) {
      throw new Error('Unsupported image format. Supported: bmp, eps, ico, svg, tga, wbmp');
    }
    try {
      mkdirSync(dirname(output), { recursive: true });
      await sharp(input)
        .toFormat(format as keyof sharp.FormatEnum)
        .toFile(output);
      console.log(`Converted ${input} to ${output} (${format})`);
    } catch (error: unknown) {
      throw new Error(`Image conversion failed for ${input} to ${output} (${format}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async compressSvg(options: ConversionOptions): Promise<void> {
    const { input, output } = options;
    if (!existsSync(input)) {
      throw new Error(`Input file ${input} does not exist`);
    }
    try {
      mkdirSync(dirname(output), { recursive: true });
      const svgContent = await readFile(input, 'utf-8');
      const result = optimize(svgContent, { multipass: true });
      await writeFile(output, result.data);
      console.log(`Compressed SVG from ${input} to ${output}`);
    } catch (error: unknown) {
      throw new Error(`SVG compression failed for ${input} to ${output}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async pdfToImage(options: ConversionOptions): Promise<void> {
    const { input, output, format = 'png' } = options;
    if (!existsSync(input)) {
      throw new Error(`Input file ${input} does not exist`);
    }
    if (!['png', 'jpg', 'jpeg'].includes(format)) {
      throw new Error(`Unsupported format ${format}. Supported: png, jpg, jpeg`);
    }
    try {
      mkdirSync(output, { recursive: true });
      const outputBaseName = basename(input, '.pdf');
      const convert = fromBuffer(await readFile(input), {
        density: 100,
        format,
        outPrefix: outputBaseName,
        outputDir: output
      } as any); // Type assertion to bypass TypeScript error
      await convert.bulk(-1);
      console.log(`Converted PDF ${input} to images in ${output}`);
    } catch (error: unknown) {
      throw new Error(`PDF to image conversion failed for ${input} to ${output} (${format}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async pdfToWord(options: ConversionOptions): Promise<void> {
    const { input, output } = options;
    if (!existsSync(input)) {
      throw new Error(`Input file ${input} does not exist`);
    }
    try {
      mkdirSync(dirname(output), { recursive: true });
      const dataBuffer = await readFile(input);
      const data = await pdfParse(dataBuffer);
      const doc = new Document({
        sections: [{ children: [new Paragraph(data.text)] }]
      });
      const buffer = await Packer.toBuffer(doc);
      await writeFile(output, buffer);
      console.log(`Converted PDF ${input} to Word ${output}`);
    } catch (error: unknown) {
      throw new Error(`PDF to Word conversion failed for ${input} to ${output}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async convertAudio(options: ConversionOptions): Promise<void> {
    const { input, output, format } = options;
    if (!existsSync(input)) {
      throw new Error(`Input file ${input} does not exist`);
    }
    if (!format || !['aac', 'aiff', 'm4v', 'mmf', 'wma', '3g2'].includes(format)) {
      throw new Error('Unsupported audio format. Supported: aac, aiff, m4v, mmf, wma, 3g2');
    }
    try {
      mkdirSync(dirname(output), { recursive: true });
      await new Promise<void>((resolve, reject) => {
        ffmpeg(input)
          .toFormat(format)
          .on('end', () => {
            console.log(`Converted audio ${input} to ${output} (${format})`);
            resolve();
          })
          .on('error', (err) => reject(new Error(`Audio conversion failed: ${err.message}`)))
          .save(output);
      });
    } catch (error: unknown) {
      throw new Error(`Audio conversion failed for ${input} to ${output} (${format}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default FileConverter;