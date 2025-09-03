# ACL Troubleshooting Guide

## Common Issues and Solutions

### 1. Frontend Permission Issues

**Problem**: UI components not showing/hiding based on permissions
**Solution**: 
```jsx
// Ensure contexts are properly wrapped
<AuthProvider>
  <AbilityProvider>
    <YourApp />
  </AbilityProvider>
</AuthProvider>

// Use Can component correctly
<Can I="read" a="Package" fallback={<div>Access denied</div>}>
  <PackageList />
</Can>
```

**Problem**: usePermissions() hook not working
**Solution**: Check that AbilityContext is loaded and permissions are fetched

### 2. Backend Permission Issues

**Problem**: API returns 401 instead of 403
**Solution**: Ensure authenticate middleware comes before checkCASLPermission

**Problem**: CASL rules not working as expected
**Solution**: Check ability definitions in casl-ability.ts match your use case

### 3. Multi-Role Issues

**Problem**: Multi-role users can't switch portals
**Solution**: Verify roles array is populated in database and user object

**Problem**: Portal switching doesn't persist
**Solution**: Implement lastUsedPortal database updates

### 4. Performance Issues

**Problem**: Slow permission checks
**Solution**: Enable permission caching (already implemented with 5-min TTL)

**Problem**: Too many database queries
**Solution**: Use bulk permission operations and proper indexing

### 5. Testing Issues

**Problem**: Tests failing with permission errors
**Solution**: Ensure test users have correct roles and credentials match config

### 6. Database Issues

**Problem**: Missing roles/portal columns
**Solution**: Run migration script to add required columns

### 7. Audit Log Issues

**Problem**: Audit logs not appearing
**Solution**: Check audit_logs table exists and AuditLogger service is connected