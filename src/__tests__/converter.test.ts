import { FileConverter } from '../index';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    toFormat: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined)
  }))
}));
jest.mock('svgo', () => ({
  optimize: jest.fn(() => ({ data: '<svg>mocked</svg>' }))
}));
jest.mock('pdf2pic', () => ({
  fromBuffer: jest.fn(() => ({
    bulk: jest.fn().mockResolvedValue(undefined)
  }))
}));
jest.mock('pdf-parse', () => jest.fn(() => Promise.resolve({ text: 'mocked text' })));
jest.mock('fluent-ffmpeg', () => jest.fn(() => ({
  toFormat: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  save: jest.fn().mockImplementation((_, cb) => cb(null))
}));
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('mocked content')),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

describe('FileConverter', () => {
  let converter: FileConverter;

  beforeEach(() => {
    converter = new FileConverter();
  });

  test('convertImage should convert image to specified format', async () => {
    await converter.convertImage({ input: 'test.jpg', output: 'test.png', format: 'png' });
    expect(require('sharp')).toHaveBeenCalled();
  });

  test('compressSvg should compress SVG file', async () => {
    await converter.compressSvg({ input: 'test.svg', output: 'test.min.svg' });
    expect(require('svgo').optimize).toHaveBeenCalled();
  });

  test('pdfToImage should convert PDF to images', async () => {
    await converter.pdfToImage({ input: 'test.pdf', output: 'output_dir', format: 'png' });
    expect(require('pdf2pic').fromBuffer).toHaveBeenCalled();
  });

  test('pdfToWord should convert PDF to Word', async () => {
    await converter.pdfToWord({ input: 'test.pdf', output: 'test.docx' });
    expect(require('pdf-parse')).toHaveBeenCalled();
  });

  test('convertAudio should convert audio to specified format', async () => {
    await converter.convertAudio({ input: 'test.mp3', output: 'test.aac', format: 'aac' });
    expect(require('fluent-ffmpeg')).toHaveBeenCalled();
  });
});