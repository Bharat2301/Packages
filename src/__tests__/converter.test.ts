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
jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn(() => ({
    toFormat: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: { save: () => void }, event: string, callback: () => void) {
      if (event === 'end') {
        callback();
      }
      return this;
    }),
    save: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    })
  }));
  return mockFfmpeg;
});
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('mocked content')),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

describe('FileConverter', () => {
  let converter: FileConverter;

  beforeEach(() => {
    converter = new FileConverter();
    jest.clearAllMocks();
  });

  test('convertImage should convert image to specified format', async () => {
    await converter.convertImage({ input: 'test.jpg', output: 'test.png', format: 'png' });
    expect(require('sharp')).toHaveBeenCalled();
  });

  test('convertImage should throw error for non-existent input', async () => {
    (require('fs').existsSync as jest.Mock).mockReturnValueOnce(false);
    await expect(
      converter.convertImage({ input: 'test.jpg', output: 'test.png', format: 'png' })
    ).rejects.toThrow('Input file test.jpg does not exist');
  });

  test('convertImage should throw error for unsupported format', async () => {
    await expect(
      converter.convertImage({ input: 'test.jpg', output: 'test.xyz', format: 'xyz' })
    ).rejects.toThrow('Unsupported image format');
  });

  test('compressSvg should compress SVG file', async () => {
    await converter.compressSvg({ input: 'test.svg', output: 'test.min.svg' });
    expect(require('svgo').optimize).toHaveBeenCalled();
  });

  test('compressSvg should throw error for non-existent input', async () => {
    (require('fs').existsSync as jest.Mock).mockReturnValueOnce(false);
    await expect(
      converter.compressSvg({ input: 'test.svg', output: 'test.min.svg' })
    ).rejects.toThrow('Input file test.svg does not exist');
  });

  test('pdfToImage should convert PDF to images', async () => {
    await converter.pdfToImage({ input: 'test.pdf', output: 'output_dir', format: 'png' });
    expect(require('pdf2pic').fromBuffer).toHaveBeenCalled();
  });

  test('pdfToImage should throw error for non-existent input', async () => {
    (require('fs').existsSync as jest.Mock).mockReturnValueOnce(false);
    await expect(
      converter.pdfToImage({ input: 'test.pdf', output: 'output_dir', format: 'png' })
    ).rejects.toThrow('Input file test.pdf does not exist');
  });

  test('pdfToImage should throw error for unsupported format', async () => {
    await expect(
      converter.pdfToImage({ input: 'test.pdf', output: 'output_dir', format: 'xyz' })
    ).rejects.toThrow('Unsupported format xyz');
  });

  test('pdfToWord should convert PDF to Word', async () => {
    await converter.pdfToWord({ input: 'test.pdf', output: 'test.docx' });
    expect(require('pdf-parse')).toHaveBeenCalled();
  });

  test('pdfToWord should throw error for non-existent input', async () => {
    (require('fs').existsSync as jest.Mock).mockReturnValueOnce(false);
    await expect(
      converter.pdfToWord({ input: 'test.pdf', output: 'test.docx' })
    ).rejects.toThrow('Input file test.pdf does not exist');
  });

  test('pdfToWord should handle pdf-parse failure gracefully', async () => {
    jest.mock('pdf-parse', () => jest.fn(() => Promise.resolve({ text: '' })));
    await converter.pdfToWord({ input: 'test.pdf', output: 'test.docx' });
    expect(require('pdf-parse')).toHaveBeenCalled();
    expect(require('fs/promises').writeFile).toHaveBeenCalled();
  });

  test('convertAudio should convert audio to specified format', async () => {
    await converter.convertAudio({ input: 'test.mp3', output: 'test.aac', format: 'aac' });
    expect(require('fluent-ffmpeg')).toHaveBeenCalled();
  });

  test('convertAudio should throw error for non-existent input', async () => {
    (require('fs').existsSync as jest.Mock).mockReturnValueOnce(false);
    await expect(
      converter.convertAudio({ input: 'test.mp3', output: 'test.aac', format: 'aac' })
    ).rejects.toThrow('Input file test.mp3 does not exist');
  });

  test('convertAudio should throw error for unsupported format', async () => {
    await expect(
      converter.convertAudio({ input: 'test.mp3', output: 'test.xyz', format: 'xyz' })
    ).rejects.toThrow('Unsupported audio format');
  });
});