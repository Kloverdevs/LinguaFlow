import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/shared/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs info with [LinguaFlow] prefix', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test message');
    expect(spy).toHaveBeenCalledWith('[LinguaFlow]', 'test message');
  });

  it('logs warn with [LinguaFlow] prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('warning message');
    expect(spy).toHaveBeenCalledWith('[LinguaFlow]', 'warning message');
  });

  it('logs error with [LinguaFlow] prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('error message');
    expect(spy).toHaveBeenCalledWith('[LinguaFlow]', 'error message');
  });

  it('supports multiple arguments', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('msg', 'arg1', 42);
    expect(spy).toHaveBeenCalledWith('[LinguaFlow]', 'msg', 'arg1', 42);
  });
});
