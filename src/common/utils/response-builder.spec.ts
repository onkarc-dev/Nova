import { ErrorCode } from '@common/enums/error-code.enum';
import { buildMetadata, errorResponse, successResponse } from './response-builder';

describe('response builders', () => {
  it('builds metadata with optional request context', () => {
    const metadata = buildMetadata('req_123', '/api/v1/health', '1');

    expect(metadata).toMatchObject({
      requestId: 'req_123',
      path: '/api/v1/health',
      version: '1',
      timestamp: expect.any(String) as string,
    });
  });

  it('wraps successful responses', () => {
    const metadata = buildMetadata('req_123');

    expect(successResponse({ ok: true }, metadata)).toEqual({
      success: true,
      data: { ok: true },
      metadata,
    });
  });

  it('wraps error responses with optional details', () => {
    const metadata = buildMetadata('req_123');

    expect(
      errorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid input', metadata, [
        { field: 'email', message: 'Email is required' },
      ]),
    ).toEqual({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input',
        details: [{ field: 'email', message: 'Email is required' }],
      },
      metadata,
    });
  });
});
