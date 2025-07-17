import sharp from 'sharp';
import { optimize } from 'svgo';
import { fromBuffer } from 'pdf2pic';
import pdfParse from 'pdf-parse';
import ffmpeg from 'fluent-ffmpeg';
import { Document, Packer, Paragraph } from 'docx';
import { readFile, writeFile } from 'fs/promises';

interface ConversionOptions {
  input: string;
  output: string;
  format?: string;
}

export class FileConverter {
  async convertImage(options: ConversionOptions): Promise<void> {
    const { input, output, format } = options;
    if (!format || !['bmp', 'eps', 'ico', 'svg', 'tga', 'wbmp'].includes(format)) {
      throw new Error('Unsupported image format. Supported: bmp, eps, ico, svg, tga, wbmp');
    }
    try {
      await sharp(input)
        .toFormat(format as keyof sharp.FormatEnum)
        .toFile(output);
      console.log(`Converted ${input} to ${output} (${format})`);
    } catch (error: unknown) {
      throw new Error(`Image conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async compressSvg(options: ConversionOptions): Promise<void> {
    const { input, output } = options;
    try {
      const svgContent = await readFile(input, 'utf-8');
      const result = optimize(svgContent, { multipass: true });
      await writeFile(output, result.data);
      console.log(`Compressed SVG from ${input} to ${output}`);
    } catch (error: unknown) {
      throw new Error(`SVG compression failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async pdfToImage(options: ConversionOptions): Promise<void> {
    const { input, output, format = 'png' } = options;
    try {
      const convert = fromBuffer(await readFile(input), {
        density: 100,
        format,
        outputDir: output,
        outputName: 'page'
      });
      await convert.bulk(-1);
      console.log(`Converted PDF ${input} to images in ${output}`);
    } catch (error: unknown) {
      throw new Error(`PDF to image conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async pdfToWord(options: ConversionOptions): Promise<void> {
    const { input, output } = options;
    try {
      const dataBuffer = await readFile(input);
      const data = await pdfParse(dataBuffer);
      const doc = new Document({
        sections: [{ children: [new Paragraph(data.text)] }]
      });
      const buffer = await Packer.toBuffer(doc);
      await writeFile(output, buffer);
      console.log(`Converted PDF ${input} to Word ${output}`);
    } catch (error: unknown) {
      throw new Error(`PDF to Word conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async convertAudio(options: ConversionOptions): Promise<void> {
    const { input, output, format } = options;
    if (!format || !['aac', 'aiff', 'm4v', 'mmf', 'wma', '3g2'].includes(format)) {
      throw new Error('Unsupported audio format. Supported: aac, aiff, m4v, mmf, wma, 3g2');
    }
    try {
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
      throw new Error(`Audio conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default FileConverter;