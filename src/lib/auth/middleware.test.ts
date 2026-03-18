import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateRequest } from './middleware';
import * as sessionModule from './session';
import * as restoreTokenModule from './validate-restore-token';

vi.mock('../db', () => ({ db: {} }));
vi.mock('./session');
vi.mock('./validate-restore-token');

describe('authenticateRequest', () => {
  const mockProfileId = 'profile-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authenticates successfully with valid X-Session-Token', async () => {
    const mockRequest = new Request('http://localhost', {
      headers: {
        'X-Session-Token': 'valid-session-token',
      },
    });

    vi.spyOn(sessionModule, 'validateSession').mockResolvedValue();

    await expect(authenticateRequest(mockRequest, mockProfileId)).resolves.toBeUndefined();

    expect(sessionModule.validateSession).toHaveBeenCalledWith(
      mockProfileId,
      'valid-session-token'
    );
    expect(restoreTokenModule.validateRestoreToken).not.toHaveBeenCalled();
  });

  it('falls back to X-Restore-Token when X-Session-Token is missing', async () => {
    const mockRequest = new Request('http://localhost', {
      headers: {
        'X-Restore-Token': 'valid-restore-token',
      },
    });

    vi.spyOn(restoreTokenModule, 'validateRestoreToken').mockResolvedValue();

    await expect(authenticateRequest(mockRequest, mockProfileId)).resolves.toBeUndefined();

    expect(sessionModule.validateSession).not.toHaveBeenCalled();
    expect(restoreTokenModule.validateRestoreToken).toHaveBeenCalledWith(
      mockProfileId,
      'valid-restore-token'
    );
  });

  it('falls back to X-Restore-Token when X-Session-Token is invalid', async () => {
    const mockRequest = new Request('http://localhost', {
      headers: {
        'X-Session-Token': 'invalid-session-token',
        'X-Restore-Token': 'valid-restore-token',
      },
    });

    const mock401Response = new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );

    vi.spyOn(sessionModule, 'validateSession').mockRejectedValue(mock401Response);
    vi.spyOn(restoreTokenModule, 'validateRestoreToken').mockResolvedValue();

    await expect(authenticateRequest(mockRequest, mockProfileId)).resolves.toBeUndefined();

    expect(sessionModule.validateSession).toHaveBeenCalledWith(
      mockProfileId,
      'invalid-session-token'
    );
    expect(restoreTokenModule.validateRestoreToken).toHaveBeenCalledWith(
      mockProfileId,
      'valid-restore-token'
    );
  });

  it('throws 401 when both X-Session-Token and X-Restore-Token are missing', async () => {
    const mockRequest = new Request('http://localhost', {
      headers: {},
    });

    const mock401Response = new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );

    vi.spyOn(restoreTokenModule, 'validateRestoreToken').mockRejectedValue(mock401Response);

    await expect(authenticateRequest(mockRequest, mockProfileId)).rejects.toThrow(Response);

    try {
      await authenticateRequest(mockRequest, mockProfileId);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(401);
    }

    expect(restoreTokenModule.validateRestoreToken).toHaveBeenCalledWith(
      mockProfileId,
      null
    );
  });

  it('throws 401 when both X-Session-Token and X-Restore-Token are invalid', async () => {
    const mockRequest = new Request('http://localhost', {
      headers: {
        'X-Session-Token': 'invalid-session-token',
        'X-Restore-Token': 'invalid-restore-token',
      },
    });

    const mock401Response = new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );

    vi.spyOn(sessionModule, 'validateSession').mockRejectedValue(mock401Response);
    vi.spyOn(restoreTokenModule, 'validateRestoreToken').mockRejectedValue(mock401Response);

    await expect(authenticateRequest(mockRequest, mockProfileId)).rejects.toThrow(Response);

    try {
      await authenticateRequest(mockRequest, mockProfileId);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(401);
    }

    expect(sessionModule.validateSession).toHaveBeenCalledWith(
      mockProfileId,
      'invalid-session-token'
    );
    expect(restoreTokenModule.validateRestoreToken).toHaveBeenCalledWith(
      mockProfileId,
      'invalid-restore-token'
    );
  });
});
