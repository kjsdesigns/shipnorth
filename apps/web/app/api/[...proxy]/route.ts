import { NextRequest, NextResponse } from 'next/server';

const EXPRESS_API_URL = process.env.API_URL || 'http://localhost:8850';

/**
 * Generic API Proxy for Session Authentication
 * 
 * Routes all /api/* requests to Express API on localhost:8850
 * Solves cross-port cookie sharing issue by making all requests same-origin
 */

async function proxyToExpressAPI(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  try {
    const { proxy } = await context.params;
    const apiPath = '/' + proxy.join('/');
    
    // Build target URL
    const targetUrl = `${EXPRESS_API_URL}${apiPath}`;
    const url = new URL(targetUrl);
    
    // Copy search params
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    
    // Prepare headers for forwarding
    const headers = new Headers();
    
    // Copy relevant headers (excluding host, connection, etc.)
    const allowedHeaders = [
      'content-type',
      'authorization', 
      'accept',
      'user-agent',
      'cache-control',
      'pragma',
      'x-test-mode',
      'x-test-role'
    ];
    
    allowedHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });
    
    // Copy cookies to forward to Express API
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers.set('cookie', cookies);
    }
    
    // Prepare request body
    let body: any = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }
    
    console.log(`🔄 PROXY: ${request.method} /api${apiPath} → ${EXPRESS_API_URL}${apiPath}`);
    console.log(`🍪 PROXY COOKIES: ${cookies ? cookies.substring(0, 100) + '...' : 'None'}`);
    
    // Debug: Log if this is an authentication-related request
    if (apiPath.includes('auth') || apiPath.includes('session')) {
      console.log(`🔐 AUTH REQUEST: ${apiPath}`);
    }
    
    // Forward request to Express API
    const response = await fetch(url.toString(), {
      method: request.method,
      headers: headers,
      body: body,
      // Don't use credentials here - we're manually forwarding cookies
    });
    
    // Prepare response
    const responseData = await response.text();
    
    // Create NextResponse with the API response
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy response headers (especially Set-Cookie for session management)
    response.headers.forEach((value, key) => {
      // Forward all headers except ones that might conflict
      const headersToForward = [
        'content-type',
        'set-cookie', // CRITICAL: Forward session cookies
        'cache-control',
        'expires',
        'etag',
        'vary'
      ];
      
      if (headersToForward.includes(key.toLowerCase())) {
        // Special handling for Set-Cookie headers
        if (key.toLowerCase() === 'set-cookie') {
          // Get all set-cookie headers (there might be multiple)
          const cookies = response.headers.getSetCookie?.() || [value];
          cookies.forEach(cookie => {
            nextResponse.headers.append('Set-Cookie', cookie);
          });
        } else {
          nextResponse.headers.set(key, value);
        }
      }
    });
    
    console.log(`✅ PROXY RESPONSE: ${response.status} ${request.method} ${apiPath}`);
    
    // Debug: Log authentication failures and cookie forwarding
    if (response.status === 401) {
      console.log(`❌ PROXY AUTH FAILURE: 401 on ${apiPath}`);
      console.log(`🍪 REQUEST HAD COOKIES: ${cookies ? 'Yes' : 'No'}`);
    }
    
    // Log Set-Cookie headers being forwarded
    const setCookies = response.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      console.log(`🍪 FORWARDING COOKIES: ${setCookies.length} cookies`);
    }
    
    return nextResponse;
    
  } catch (error) {
    console.error(`❌ PROXY ERROR: ${request.method} ${request.url}:`, error);
    
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Export handlers for all HTTP methods
export async function GET(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyToExpressAPI(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyToExpressAPI(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyToExpressAPI(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyToExpressAPI(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  return proxyToExpressAPI(request, context);
}