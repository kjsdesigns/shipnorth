# Claude Code Patterns for Shipnorth

## Project Overview
Shipnorth is an autonomous shipping and billing system integrating Stripe for payments and ShipStation for carrier label management.

## Question Format Pattern
When asking multiple questions during planning or implementation, format them as:

```
**Question N: Topic**:
     a. Option one description
     b. Option two description
     c. Option three description
     d. Option four description
```

Limit to maximum 6 questions at a time for easier responses.

## Project Patterns

### Planning Pattern
1. All release plans stored in `./plans/` as markdown files
2. Format: `NNN-description.md` (e.g., `001-shipnorth-mvp.md`)
3. Each plan must include:
   - Executive summary
   - Architecture overview
   - Implementation phases
   - Test assertions (at bottom)
4. Test assertions must be comprehensive and testable

### Documentation Pattern
1. Application spec available at `/docs` endpoint
2. Includes:
   - API specification (OpenAPI)
   - Business rules
   - Concept definitions
   - Workflows
   - Change history
3. Auto-updated when plans are implemented
4. Shows plan implementation dates

### Testing Pattern
1. Test cases developed for all assertions in plan
2. Tests must pass before deployment
3. Testing stages:
   - Unit tests (compile time)
   - Integration tests (API/DB)
   - E2E tests (Playwright in browser)
4. Impossible to break dev server with changes

### Development Workflow
1. Local changes trigger tests automatically
2. All tests must pass before push
3. Push to main deploys to dev automatically
4. CI/CD from day one
5. Separate test database for dev environment

### Key Technical Decisions
- **Database**: AWS DynamoDB (single-table design)
- **Backend**: Express.js traditional web app
- **Frontend**: Next.js with Tailwind CSS
- **Auth**: JWT (24hr access, 30-day refresh)
- **Infrastructure**: AWS CDK
- **Monitoring**: Sentry + CloudWatch
- **Secrets**: AWS Secrets Manager + Parameter Store

### AWS Configuration
- **Account**: 905418363362
- **User**: Claude
- **Region**: us-east-1 (primary), ca-central-1 (available)
- **DynamoDB**: Shared dev instance accessible locally
- **EC2 SSH Key**: shipnorth-dev (stored at ~/.ssh/shipnorth-dev.pem)

### Notification Configuration
- **Email**: Configurable per environment in database
- **SMS**: For critical failures only
- **Default**: kjsdesigns@gmail.com

### Business Rules Summary
1. Staff-only package intake
2. Immediate charge on label purchase
3. All ShipStation carriers available
4. Manual refund approval required
5. AI-optimized load planning with manual override
6. 5-minute tracking update interval
7. Session-based file access through S3

### Testing Requirements
- Unit test coverage: >80%
- All API endpoints must have tests
- Critical user journeys in E2E tests
- Load testing: 200 req/min capability
- Separate test database for dev

### Rate Limiting
- 200 requests per minute per IP
- Applied at API Gateway level

### File Structure
```
shipnorth/
├── plans/                 # Release plans
├── apps/
│   ├── web/              # Next.js portal
│   └── api/              # Express backend
├── packages/
│   ├── database/         # DynamoDB models
│   ├── shared/           # Shared types/utils
│   └── ui/               # Shared components
├── infrastructure/       # AWS CDK
├── docs/                 # Documentation
└── tests/                # E2E tests
```

## Commands to Remember
```bash
# Local development
npm run dev

# Run tests
npm run test
npm run test:e2e

# Deploy to dev (automatic on push)
git push origin main

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Environment Variables
Store in AWS Parameter Store and Secrets Manager:
- Secrets (API keys): Secrets Manager
- Config (URLs, flags): Parameter Store

## Future Session Context
When resuming work on this project:
1. Check current git branch and status
2. Review latest plan in `./plans/`
3. Check test status
4. Review any pending TODOs
5. Verify AWS credentials still valid
6. EC2 SSH key available at: ~/.ssh/shipnorth-dev.pem (created 2025-08-13)