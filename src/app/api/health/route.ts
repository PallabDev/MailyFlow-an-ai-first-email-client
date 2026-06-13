import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/corsair';
import { healthLogs } from '@/db/schema';
import crypto from 'crypto';
import { HealthCheckResponse } from './_types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  try {
    // Perform a database ping/query to verify connection health
    // Drizzleexecute is used for raw sql execution
    await db.execute('SELECT 1');

    // Insert a healthy check record in database logs
    const id = crypto.randomUUID();
    await db.insert(healthLogs).values({
      id,
      status: 'healthy',
      message: 'System check completed successfully. Database ping succeeded.',
    });

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'System check passed.',
    });
  } catch (error: unknown) {
    console.error('Health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown Error';

    try {
      // Attempt to log the failure in the database
      const id = crypto.randomUUID();
      await db.insert(healthLogs).values({
        id,
        status: 'unhealthy',
        message: `System check failed: ${errorMessage}`,
      });
    } catch (dbErr) {
      console.error('Failed to log health check failure to database:', dbErr);
    }

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
