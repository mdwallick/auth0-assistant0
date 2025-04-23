
import { NextResponse } from 'next/server';
import { serviceManager } from '@/lib/auth0';

export async function GET() {
  const activeServices = serviceManager.getActiveServices();
  
  return NextResponse.json({
    activeServices
  });
}
