# 🔐 Environment Variables & API Key Security

## ✅ Current Security Measures

### 1. **API Keys Are NOT in GitHub**
All sensitive credentials are stored in `.env` files which are:
- ✅ Listed in `.gitignore` (lines 31-35)
- ✅ Never committed to the repository
- ✅ Only exist on local machines and servers

### 2. **What IS in GitHub (Safe)**
- `.env.example` files with dummy values
- Documentation without real credentials
- Code that reads from environment variables

## 📁 Environment File Structure

```
shipnorth/
├── .gitignore                    # Excludes all .env files
├── apps/
│   ├── api/
│   │   ├── .env                 # LOCAL ONLY - Never in Git
│   │   ├── .env.example         # Safe template in Git
│   │   └── .env.production      # PRODUCTION ONLY - Never in Git
│   └── web/
│       ├── .env.local           # LOCAL ONLY - Never in Git
│       └── .env.example         # Safe template in Git
```

## 🔑 Environment Management Strategy

### Local Development (Your Machine)
```bash
# Location: /apps/api/.env
PAYPAL_CLIENT_ID=AcMoyF3jb...  # Your sandbox key
PAYPAL_CLIENT_SECRET=ELBZ4V...  # Your sandbox secret
AWS_REGION=ca-central-1         # Uses your AWS profile
# No AWS keys needed - uses local AWS CLI credentials
```

### Development Server (Staging)
```bash
# Location: Server's environment variables
PAYPAL_CLIENT_ID=${DEV_PAYPAL_ID}      # Sandbox credentials
PAYPAL_CLIENT_SECRET=${DEV_PAYPAL_KEY}  # Sandbox secret
AWS_REGION=ca-central-1
# Uses IAM role - no keys needed
```

### Production Server
```bash
# Location: Server's environment variables or AWS Secrets Manager
PAYPAL_CLIENT_ID=${PROD_PAYPAL_ID}      # Live credentials
PAYPAL_CLIENT_SECRET=${PROD_PAYPAL_KEY}  # Live secret
AWS_REGION=ca-central-1
# Uses IAM role - no keys needed
```

## 🛡️ Security Best Practices Implemented

### 1. **Never Store Keys in Code**
```typescript
// ❌ WRONG - Never do this
const clientId = "AcMoyF3jb...";

// ✅ CORRECT - Always use environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
```

### 2. **Use AWS IAM Roles (Not Keys)**
```typescript
// ✅ We're using IAM roles, not access keys
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  // No credentials specified - uses IAM role
});
```

### 3. **Different Keys per Environment**
- **Local**: Your personal sandbox keys
- **Dev/Staging**: Shared sandbox keys
- **Production**: Live keys (stored securely)

## 🚀 Deployment Security

### Option 1: AWS Secrets Manager (Recommended)
```bash
# Store secrets in AWS
aws secretsmanager create-secret \
  --name shipnorth/production \
  --secret-string '{
    "PAYPAL_CLIENT_ID":"live_key",
    "PAYPAL_CLIENT_SECRET":"live_secret"
  }'

# In your app, retrieve at runtime
const secrets = await getSecrets('shipnorth/production');
```

### Option 2: Environment Variables on Server
```bash
# On EC2/ECS/Lambda
export PAYPAL_CLIENT_ID=live_key
export PAYPAL_CLIENT_SECRET=live_secret
```

### Option 3: CI/CD Pipeline Secrets
```yaml
# GitHub Actions secrets
env:
  PAYPAL_CLIENT_ID: ${{ secrets.PAYPAL_CLIENT_ID }}
  PAYPAL_CLIENT_SECRET: ${{ secrets.PAYPAL_CLIENT_SECRET }}
```

## 📋 Setup for New Developer

### 1. Clone Repository
```bash
git clone https://github.com/kjsdesigns/shipnorth.git
cd shipnorth
```

### 2. Create Local Environment Files
```bash
# Copy templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 3. Get Credentials Securely
- PayPal sandbox: Create own developer account
- AWS: Use personal AWS account or get IAM user
- Never share credentials via email/Slack/Git

### 4. Configure AWS CLI
```bash
aws configure
# Enter your personal AWS credentials
```

## 🔄 Credential Rotation

### Monthly Tasks
- [ ] Rotate JWT secrets
- [ ] Review AWS IAM permissions
- [ ] Check for exposed keys in Git history

### Quarterly Tasks
- [ ] Rotate PayPal API credentials
- [ ] Update AWS access keys (if using)
- [ ] Audit environment variable usage

## 🚨 If Keys Are Exposed

### Immediate Actions (Within 5 Minutes)
1. **Revoke compromised credentials**
   - PayPal: Dashboard → API Credentials → Revoke
   - AWS: IAM Console → Deactivate keys
   
2. **Generate new credentials**
   
3. **Update all environments**
   
4. **Check for unauthorized usage**

### Follow-up Actions
1. Review Git history for exposure
2. Use `git filter-branch` to remove from history
3. Force push cleaned history
4. Notify team of credential rotation

## 📝 Environment File Templates

### `/apps/api/.env.example`
```bash
# Database
AWS_REGION=ca-central-1
DYNAMODB_TABLE_NAME=shipnorth-main

# JWT
JWT_SECRET=change-this-in-production
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=30d

# PayPal
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-secret
PAYPAL_ENVIRONMENT=sandbox

# AWS Services (uses IAM role, no keys needed)
SES_FROM_EMAIL=noreply@yourdomain.com
SNS_DEFAULT_SENDER_ID=SHIPNORTH
```

### Never Commit These Patterns
```gitignore
# Add to .gitignore
.env*
!.env.example
!.env.*.example
*.pem
*.key
*_rsa
*_dsa
*_ecdsa
*_ed25519
credentials.json
secrets.json
```

## 🔍 Verify Security

### Check Git for Secrets
```bash
# Install git-secrets
brew install git-secrets

# Scan repository
git secrets --scan

# Prevent future commits with secrets
git secrets --install
git secrets --register-aws
```

### Check Current Status
```bash
# Verify .env is not tracked
git status --ignored | grep .env

# Check Git history for secrets
git log -p | grep -E "(secret|key|token|password)"
```

## ✅ Summary

Your API keys are **SAFE** because:

1. ✅ `.env` files are in `.gitignore`
2. ✅ Only example files are in Git
3. ✅ AWS uses IAM roles, not keys
4. ✅ PayPal keys are environment-specific
5. ✅ Production keys stored separately
6. ✅ Each developer uses own sandbox keys
7. ✅ No credentials in code, only env vars

## 🎯 Action Items for Production

1. **Before Going Live**:
   - [ ] Set up AWS Secrets Manager
   - [ ] Create production PayPal app
   - [ ] Configure IAM roles for EC2/ECS
   - [ ] Set up key rotation schedule
   - [ ] Enable AWS CloudTrail for audit

2. **For CI/CD**:
   - [ ] Add secrets to GitHub Actions
   - [ ] Use separate AWS account for production
   - [ ] Enable branch protection rules
   - [ ] Require PR reviews for main branch

3. **For Team**:
   - [ ] Document credential sharing process
   - [ ] Set up 1Password/LastPass for team
   - [ ] Create onboarding checklist
   - [ ] Schedule security training