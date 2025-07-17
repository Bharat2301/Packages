#!/usr/bin/env node

import { program } from 'commander';
import { FileConverter } from './index.js';

const converter = new FileConverter();

program
  .version('1.0.0')
  .description('Multi-format file converter CLI');

program
  .command('image')
  .description('Convert image files')
  .option('-i, --input <path>', 'Input file path')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Target format (bmp, eps, ico, svg, tga, wbmp)')
  .action(async (options: { input: string; output: string; format?: string }) => {
    try {
      await converter.convertImage(options);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('compress-svg')
  .description('Compress SVG files')
  .option('-i, --input <path>', 'Input SVG file path')
  .option('-o, --output <path>', 'Output SVG file path')
  .action(async (options: { input: string; output: string }) => {
    try {
      await converter.compressSvg(options);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('pdf-to-image')
  .description('Convert PDF to images')
  .option('-i, --input <path>', 'Input PDF file path')
  .option('-o, --output <path>', 'Output directory for images')
  .option('-f, --format <format>', 'Image format (default: png)')
  .action(async (options: { input: string; output: string; format?: string }) => {
    try {
      await converter.pdfToImage(options);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('pdf-to-word')
  .description('Convert PDF to Word (text)')
  .option('-i, --input <path>', 'Input PDF file path')
  .option('-o, --output <path>', 'Output Word file path')
  .action(async (options: { input: string; output: string }) => {
    try {
      await converter.pdfToWord(options);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('audio')
  .description('Convert audio files')
  .option('-i, --input <path>', 'Input audio file path')
  .option('-o, --output <path>', 'Output audio file path')
  .option('-f, --format <format>', 'Target format (aac, aiff, m4v, mmf, wma, 3g2)')
  .action(async (options: { input: string; output: string; format?: string }) => {
    try {
      await converter.convertAudio(options);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse(process.argv);