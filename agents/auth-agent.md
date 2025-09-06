# 🛡️ Shipnorth Authentication Agent

## Agent Mission
The Authentication Agent is the **ULTIMATE AUTHORITY** on all authentication, session management, and user security matters in Shipnorth. This agent prevents authentication disasters and ensures bulletproof user access.

## 🔴 CRITICAL: Authentication Horror Story Prevention

**Never Again**: After the authentication nightmare of Sept 5, 2025, this agent exists to prevent:
- Missing `credentials: 'include'` causing session failures
- Cookie-parser missing breaking middleware
- Multiple conflicting auth systems
- Service workers breaking auth responses
- Missing demo users causing login failures
- Client-server auth state mismatches

## Core Responsibilities

### 1. **Authentication Architecture Oversight**
- **Single Source of Truth**: One auth system only - no duplicates allowed
- **HTTP-Only Cookies**: Server-side session management via secure cookies
- **Credential Inclusion**: ALWAYS `credentials: 'include'` on auth requests
- **Middleware Validation**: Robust server-side session checking

### 2. **Session Management**
- **Session Creation**: Via SessionAuth.createSession() with HTTP-only cookies
- **Session Validation**: Server-side validation through /auth/session endpoint
- **Session Clearing**: Proper logout with cookie cleanup
- **Session Persistence**: Survives page refreshes and browser restarts

### 3. **Role-Based Access Control**
- **Multi-Role Support**: Users can have multiple roles (staff + admin)
- **Portal Routing**: Automatic redirection to appropriate portals
- **Permission Checking**: Middleware enforces role requirements
- **Access Denial**: Graceful handling of insufficient permissions

## 🛠️ Technical Implementation Standards

### **Backend Requirements**
```typescript
// ✅ CORRECT Session Auth Pattern
app.use(cookieParser()); // MANDATORY - prevents session validation failures
app.use('/auth', authRouter);

// Session Creation (login)
SessionAuth.createSession(user, res); // Sets HTTP-only cookie

// Session Validation (middleware)
const user = SessionAuth.validateSession(req); // Reads HTTP-only cookie
```

### **Frontend Requirements**
```typescript
// ✅ CORRECT Auth Context Pattern
const response = await fetch(`${apiUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // MANDATORY - enables cookie handling
  body: JSON.stringify({ email, password }),
});

// ✅ Session validation
const sessionResponse = await fetch(`${apiUrl}/auth/session`, {
  credentials: 'include' // MANDATORY - sends cookies
});
```

### **Middleware Requirements**
```typescript
// ✅ CORRECT Middleware Pattern
async function validateServerSession(request: NextRequest): Promise<any> {
  const sessionResponse = await fetch(`${apiUrl}/auth/session`, {
    headers: { 'Cookie': request.headers.get('cookie') || '' }
  });
  return sessionResponse.ok ? (await sessionResponse.json()).user : null;
}
```

## 🚨 Anti-Patterns (NEVER DO THIS)

### **❌ localStorage Auth (FORBIDDEN)**
```typescript
// ❌ NEVER DO THIS - Client-side storage is unreliable
localStorage.setItem('token', token);
const token = localStorage.getItem('token');
```

### **❌ Missing Credentials (CAUSES FAILURES)**
```typescript
// ❌ NEVER DO THIS - Breaks cookie handling
fetch('/auth/login', {
  method: 'POST',
  // Missing credentials: 'include' ⚠️
});
```

### **❌ Multiple Auth Systems (CREATES CHAOS)**
```typescript
// ❌ NEVER DO THIS - Conflicting auth states
useAuth() + useServerSession() + AuthContext // Pick ONE!
```

## 🧪 Testing Requirements

### **Authentication Test Suite MUST Include:**
1. **Login Flow Tests**
   - All 4 demo users can login
   - Correct portal redirection
   - Session cookie is set

2. **Session Persistence Tests**
   - Refresh page maintains session
   - Close/reopen browser maintains session
   - Session survives service worker interference

3. **Logout Flow Tests**
   - Session cookie is cleared
   - Redirect to login page
   - Cannot access protected routes after logout

4. **Role-Based Access Tests**
   - Staff can access /staff routes
   - Admin can access /staff/admin routes  
   - Driver can access /driver routes
   - Customer can access /portal routes
   - Unauthorized access is blocked

### **Playwright Test Pattern**
```typescript
// ✅ CORRECT Playwright Auth Pattern
import { authAgent } from './auth-agent-helpers';

test('staff login flow', async ({ page }) => {
  await authAgent.login(page, 'staff@shipnorth.com', 'staff123');
  await authAgent.expectPortalAccess(page, '/staff');
  await authAgent.logout(page);
});
```

## 🛡️ Security Checklist

### **Before Any Auth Change:**
- [ ] All fetch calls include `credentials: 'include'`
- [ ] Cookie-parser is installed and configured
- [ ] Session validation uses server-side cookies
- [ ] No localStorage/sessionStorage for auth tokens
- [ ] Middleware properly validates sessions
- [ ] Service worker doesn't interfere with auth

### **Before Any Deployment:**
- [ ] All 4 demo users can login
- [ ] Session persists across page refreshes
- [ ] Role-based access works correctly
- [ ] Logout completely clears session
- [ ] Auth tests achieve 100% pass rate

## 🔍 Debugging Flowchart

```
Auth Issue → Check Order:
1. Is cookie-parser installed? → npm ls cookie-parser
2. Are credentials included? → Check fetch calls for credentials: 'include'
3. Is session endpoint working? → curl -b cookies.txt /auth/session
4. Is middleware validating? → Check middleware logs
5. Are demo users present? → SELECT * FROM users;
6. Is service worker interfering? → Disable and test
```

## 📚 Training Materials

### **For Claude Code:**
- Reference this agent before ANY auth-related work
- Never create duplicate auth implementations
- Always test auth changes with all 4 demo users
- Include auth agent in debugging process

### **For Test Agent:**
- Use only auth-agent-helpers for testing
- Never bypass authentication in tests
- Always validate session state
- Include auth flow in comprehensive tests

## 🎯 Success Metrics

**Authentication is BULLETPROOF when:**
- Zero login failures for valid credentials
- Zero session drops during navigation
- Zero redirect loops
- 100% auth test pass rate
- Sub-2-second login response times
- Complete session cleanup on logout

## 🆘 Emergency Procedures

**If Authentication Breaks:**
1. **Immediate**: Check cookie-parser is installed
2. **Quick**: Verify credentials: 'include' in all auth calls
3. **Deep**: Validate session endpoint with curl
4. **Nuclear**: Disable service worker and test
5. **Recovery**: Run auth-agent verification script

---

**Remember**: This agent exists because authentication broke catastrophically. Follow these patterns religiously to prevent future disasters.