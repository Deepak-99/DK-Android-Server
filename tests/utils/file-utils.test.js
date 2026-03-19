const fs = require('fs-extra');
const path = require('path');
const {
  generateUniqueFilename,
  getFileExtension,
  isValidFileType,
  deleteFile,
  createDirectoryIfNotExists
} = require('../../utils/file-utils');

// Mock the file system
jest.mock('fs-extra');

describe('File Utilities', () => {
  const testDir = path.join(__dirname, 'test-uploads');
  const testFile = path.join(testDir, 'test.txt');
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock fs-extra methods
    fs.pathExists.mockResolvedValue(false);
    fs.ensureDir.mockResolvedValue(undefined);
    fs.unlink.mockResolvedValue(undefined);
  });
  
  describe('generateUniqueFilename', () => {
    it('should generate a unique filename with extension', () => {
      const originalName = 'test.txt';
      const uniqueName = generateUniqueFilename(originalName);
      
      expect(uniqueName).toMatch(/^[a-f0-9]{32}\.txt$/);
    });
    
    it('should handle filenames without extension', () => {
      const originalName = 'test';
      const uniqueName = generateUniqueFilename(originalName);
      
      expect(uniqueName).toMatch(/^[a-f0-9]{32}$/);
    });
    
    it('should handle filenames with multiple dots', () => {
      const originalName = 'test.file.name.txt';
      const uniqueName = generateUniqueFilename(originalName);
      
      expect(uniqueName).toMatch(/^[a-f0-9]{32}\.txt$/);
    });
  });
  
  describe('getFileExtension', () => {
    it('should return the correct file extension', () => {
      expect(getFileExtension('test.txt')).toBe('.txt');
      expect(getFileExtension('test.file.name.jpg')).toBe('.jpg');
      expect(getFileExtension('test')).toBe('');
      expect(getFileExtension('test.')).toBe('');
      expect(getFileExtension('')).toBe('');
    });
  });
  
  describe('isValidFileType', () => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    it('should validate file types correctly', () => {
      expect(isValidFileType('image/jpeg', allowedTypes)).toBe(true);
      expect(isValidFileType('image/png', allowedTypes)).toBe(true);
      expect(isValidFileType('application/pdf', allowedTypes)).toBe(true);
      expect(isValidFileType('text/plain', allowedTypes)).toBe(false);
    });
    
    it('should handle wildcard types', () => {
      const wildcardTypes = ['image/*', 'application/pdf'];
      
      expect(isValidFileType('image/jpeg', wildcardTypes)).toBe(true);
      expect(isValidFileType('image/png', wildcardTypes)).toBe(true);
      expect(isValidFileType('application/pdf', wildcardTypes)).toBe(true);
      expect(isValidFileType('text/plain', wildcardTypes)).toBe(false);
    });
    
    it('should handle empty allowed types', () => {
      expect(isValidFileType('image/jpeg', [])).toBe(false);
    });
  });
  
  describe('createDirectoryIfNotExists', () => {
    it('should create directory if it does not exist', async () => {
      fs.pathExists.mockResolvedValueOnce(false);
      
      await createDirectoryIfNotExists(testDir);
      
      expect(fs.pathExists).toHaveBeenCalledWith(testDir);
      expect(fs.ensureDir).toHaveBeenCalledWith(testDir);
    });
    
    it('should not create directory if it already exists', async () => {
      fs.pathExists.mockResolvedValueOnce(true);
      
      await createDirectoryIfNotExists(testDir);
      
      expect(fs.pathExists).toHaveBeenCalledWith(testDir);
      expect(fs.ensureDir).not.toHaveBeenCalled();
    });
    
    it('should handle errors when creating directory', async () => {
      const error = new Error('Failed to create directory');
      fs.pathExists.mockResolvedValueOnce(false);
      fs.ensureDir.mockRejectedValueOnce(error);
      
      await expect(createDirectoryIfNotExists(testDir)).rejects.toThrow(error);
    });
  });
  
  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      fs.pathExists.mockResolvedValueOnce(true);
      
      await deleteFile(testFile);
      
      expect(fs.pathExists).toHaveBeenCalledWith(testFile);
      expect(fs.unlink).toHaveBeenCalledWith(testFile);
    });
    
    it('should not throw error if file does not exist', async () => {
      fs.pathExists.mockResolvedValueOnce(false);
      
      await deleteFile(testFile);
      
      expect(fs.pathExists).toHaveBeenCalledWith(testFile);
      expect(fs.unlink).not.toHaveBeenCalled();
    });
    
    it('should throw error if file deletion fails', async () => {
      const error = new Error('Failed to delete file');
      fs.pathExists.mockResolvedValueOnce(true);
      fs.unlink.mockRejectedValueOnce(error);
      
      await expect(deleteFile(testFile)).rejects.toThrow(error);
    });
  });
  
  describe('File Size Validation', () => {
    it('should validate file size against maximum size', () => {
      const isValidSize = (fileSize, maxSize) => fileSize <= maxSize;
      
      expect(isValidSize(1024, 2048)).toBe(true); // 1KB < 2KB
      expect(isValidSize(2048, 2048)).toBe(true); // Equal
      expect(isValidSize(3000, 2048)).toBe(false); // 3KB > 2KB
    });
  });
});
