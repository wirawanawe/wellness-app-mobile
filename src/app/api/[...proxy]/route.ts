import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function handleProxy(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const { params } = context;
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : '';
    const role = session?.user ? (session.user as any).role : '';
    const companyId = session?.user ? (session.user as any).companyId : '';

    const path = `/${(await params).proxy.join('/')}`;
    const searchParams = request.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/api${path}${searchParams}`;

    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);
    headers.set('x-user-role', role);
    if(companyId) headers.set('x-company-id', companyId);

    // Filter host to avoid conflicts
    headers.delete('host');

    const options: any = {
      method: request.method,
      headers,
      duplex: 'half',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      options.body = request.body;
    }

    const response = await fetch(targetUrl, options);
    
    // Pass back the backend response exactly
    const data = await response.text();
    let parsedData = data;
    try { parsedData = JSON.parse(data); } catch { /* text */ }

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    console.error('[PROXY ERROR]', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as DELETE };
