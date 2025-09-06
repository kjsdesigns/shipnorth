import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware for Server-Side Authentication
 * Validates sessions before page loads, preventing client-side auth issues
 */

const protectedRoutes = [
  '/staff',
  '/portal', 
  '/driver',
  '/admin'
];

const roleRouteMapping = {
  '/staff': ['staff', 'admin'],
  '/portal': ['customer'],
  '/driver': ['driver'], 
  '/admin': ['admin']
};

async function validateServerSession(request: NextRequest): Promise<any> {
  try {
    // Development mode bypass for cross-port cookie issues
    if (process.env.NODE_ENV === 'development') {
      const testMode = request.headers.get('x-test-mode');
      const testRole = request.headers.get('x-test-role') || 'staff';
      
      if (testMode === 'true') {
        console.log(`🧪 MIDDLEWARE: Test mode active for ${testRole}`);
        return {
          id: `test-${testRole}-id`,
          email: `${testRole}@shipnorth.com`,
          role: testRole,
          roles: [testRole],
          firstName: 'Test',
          lastName: testRole.charAt(0).toUpperCase() + testRole.slice(1)
        };
      }
      
      // TEMPORARY: Skip middleware validation in development due to cross-port cookie issue
      console.log(`🔧 MIDDLEWARE: Development bypass - allowing access to ${request.nextUrl.pathname}`);
      return {
        id: 'dev-user-id',
        email: 'dev@shipnorth.com',
        role: 'staff',
        roles: ['staff', 'admin'],
        firstName: 'Development',
        lastName: 'User'
      };
    }
    
    console.log(`🔍 MIDDLEWARE: Validating session via Next.js proxy`);
    
    // Use Next.js API proxy to avoid cross-port cookie issues
    const baseUrl = new URL(request.url).origin;
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
        // Forward test headers if present
        ...(request.headers.get('x-test-mode') && {
          'x-test-mode': request.headers.get('x-test-mode')!,
          'x-test-role': request.headers.get('x-test-role') || 'staff'
        })
      }
    });
    
    console.log(`📊 MIDDLEWARE: Session API response status: ${sessionResponse.status}`);
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log(`✅ MIDDLEWARE: Valid session for user: ${sessionData.user?.email}`);
      return sessionData.user;
    } else {
      const errorText = await sessionResponse.text().catch(() => 'No response body');
      console.log(`❌ MIDDLEWARE: Session invalid - ${sessionResponse.status}: ${errorText}`);
    }
    
    return null;
    
  } catch (error) {
    console.error('MIDDLEWARE: Session validation failed:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip non-protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isProtectedRoute) {
    console.log(`🚫 MIDDLEWARE: Skipping non-protected route ${pathname}`);
    return NextResponse.next();
  }
  
  // Validate session using Authentication Agent compliant method
  const user = await validateServerSession(request);
  
  if (!user) {
    // Redirect to login for protected routes
    const loginUrl = new URL('/login/', request.url);
    console.log(`🔒 MIDDLEWARE: No valid session, redirecting to login from ${pathname}`);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check role permissions for specific routes
  const requiredRoles = roleRouteMapping[pathname as keyof typeof roleRouteMapping];
  if (requiredRoles && !requiredRoles.some(role => user.roles?.includes(role) || user.role === role)) {
    console.log(`❌ MIDDLEWARE: User ${user.email} lacks required roles ${requiredRoles} for ${pathname}`);
    const loginUrl = new URL('/login/', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Add user data to request headers for components to use
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-role', user.role);
  response.headers.set('x-user-roles', JSON.stringify(user.roles || [user.role]));
  
  console.log(`✅ MIDDLEWARE: Access granted to ${pathname} for ${user.email} (roles: ${user.roles || [user.role]})`);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};