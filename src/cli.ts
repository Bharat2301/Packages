#!/usr/bin/env node

import { program } from 'commander';
import { FileConverter } from './index.js';

const converter = new FileConverter();

program
  .version('1.0.0')
  .description('Multi-format file converter CLI');

program
  .command('image')
  .description('Convert image files to formats: bmp, eps, ico, svg, tga, wbmp')
  .requiredOption('-i, --input <path>', 'Input file path')
  .requiredOption('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Target format (bmp, eps, ico, svg, tga, wbmp)')
  .action(async (options: { input: string; output: string; format?: string }) => {
    try {
      await converter.convertImage(options);
    } catch (error: unknown) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Ensure the input file exists and you have write permissions for the output path.');
      process.exit(1);
    }
  });

program
  .command('compress-svg')
  .description('Compress SVG files')
  .requiredOption('-i, --input <path>', 'Input SVG file path')
  .requiredOption('-o, --output <path>', 'Output SVG file path')
  .action(async (options: { input: string; output: string }) => {
    try {
      await converter.compressSvg(options);
    } catch (error: unknown) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Ensure the input file exists and you have write permissions for the output path.');
      process.exit(1);
    }
  });

program
  .command('pdf-to-image')
  .description('Convert PDF to images (supported formats: png, jpg, jpeg)')
  .requiredOption('-i, --input <path>', 'Input PDF file path')
  .requiredOption('-o, --output <path>', 'Output directory for images')
  .option('-f, --format <format>', 'Image format (default: png)')
  .action(async (options: { input: string; output: string; format?: string }) => {
    try {
      await converter.pdfToImage(options);
    } catch (error: unknown) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Ensure the input file exists and you have write permissions for the output directory.');
      process.exit(1);
    }
  });

program
  .command('pdf-to-word')
  .description('Convert PDF to Word (text)')
  .requiredOption('-i, --input <path>', 'Input PDF file path')
  .requiredOption('-o, --output <path>', 'Output Word file path')
  .action(async (options: { input: string; output: string }) => {
    try {
      await converter.pdfToWord(options);
    } catch (error: unknown) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Ensure the input file exists and you have write permissions for the output path.');
      process.exit(1);
    }
  });

program
  .command('audio')
  .description('Convert audio files to formats: aac, aiff, m4v, mmf, wma, 3g2')
  .requiredOption('-i, --input <path>', 'Input audio file path')
  .requiredOption('-o, --output <path>', 'Output audio file path')
  .option('-f, --format <format>', 'Target format (aac, aiff, m4v, mmf, wma, 3g2)')
  .action(async (options: { input: string; output: string; format?: string }) => {
    try {
      await converter.convertAudio(options);
    } catch (error: unknown) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Ensure the input file exists and you have write permissions for the output path.');
      process.exit(1);
    }
  });

program.parse(process.argv);