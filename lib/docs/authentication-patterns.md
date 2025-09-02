# 🔐 Authentication Patterns Guide

## **Two Authentication Approaches**

### **1. `usePrivy()` - Lightweight Auth State**

**Use for:**
- Login/logout UI components
- Simple show/hide content based on auth
- Performance-critical components
- Components that don't need user data

**Pattern:**
```typescript
import { usePrivy } from '@privy-io/react-auth'

const { ready, authenticated, login, logout } = usePrivy()

// Good for:
if (!authenticated) return <LoginButton onClick={login} />

// tRPC pattern (simple):
const { data } = trpc.publicData.useQuery({}, {
  enabled: ready && authenticated // Simple check
})
```

**What you get:**
- `ready`: Privy SDK initialized
- `authenticated`: User has valid Privy session
- `login/logout`: Auth actions
- `user`: Basic Privy user object (limited data)

---

### **2. `useUser()` - Full User Context**

**Use for:**
- Business logic requiring user data
- tRPC queries needing user information
- Components displaying user-specific info
- Credit/payment functionality

**Pattern:**
```typescript
import { useUser } from '@/hooks/use-user'

const { user, isReady, isAuthenticated } = useUser()

// tRPC pattern (robust):
const { data } = trpc.users.getCredits.useQuery({}, {
  enabled: isReady && isAuthenticated && !!user?.id
})
```

**What you get:**
- `user`: Full database user object (id, email, credits, etc.)
- `isReady`: Auth fully loaded + user synced
- `isAuthenticated`: Logged in + database sync complete
- `loading/error`: Sync operation status

---

## **Migration Checklist**

### **Components that should use `useUser()`:**
- ✅ Components needing user.id for tRPC calls
- ✅ Credit/payment displays
- ✅ User profile information
- ✅ Business logic requiring user context

### **Components that should use `usePrivy()`:**
- ✅ Login/logout buttons
- ✅ Simple auth guards
- ✅ Performance-critical auth checks
- ✅ UI that doesn't need user data

### **tRPC Enabled Conditions:**

```typescript
// ❌ Too simple (can cause race conditions):
{ enabled: authenticated }

// ✅ Robust (recommended):
{ enabled: isReady && isAuthenticated && !!user?.id }

// ✅ Public data with optional auth:
{ enabled: isReady }

// ✅ No auth required:
// No enabled condition needed
```