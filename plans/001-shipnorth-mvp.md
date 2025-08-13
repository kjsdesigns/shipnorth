# Plan 001: Shipnorth MVP
**Created**: 2025-08-13  
**Status**: In Progress  
**Target Completion**: 5 weeks from start

## Executive Summary
Build a lightweight, automated shipping and billing system for Shipnorth that integrates with Stripe for payments and ShipStation for carrier label management. The system will support staff-only package intake, automatic charging, load planning with AI optimization, and comprehensive customer/driver portals.

## Architecture Overview

### Tech Stack
- **Backend**: Node.js + Express
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Database**: AWS DynamoDB (single-table design)
- **Authentication**: JWT (24hr access, 30-day refresh tokens)
- **File Storage**: AWS S3 with session-based access
- **Queue**: AWS SQS for async operations
- **Infrastructure**: AWS CDK (TypeScript)
- **Monitoring**: Sentry + CloudWatch
- **CI/CD**: GitHub Actions

### System Components
1. Staff Portal (admin.shipnorth.com)
2. Customer Portal (portal.shipnorth.com)
3. Driver Mobile Web Interface
4. REST API Backend
5. Background Job Processors
6. Webhook Handlers

## Database Schema (DynamoDB Single Table)

### Table: shipnorth-main
- **PK** (Partition Key): Entity#ID format
- **SK** (Sort Key): Metadata or relationship
- **GSI1PK/GSI1SK**: Customer access patterns
- **GSI2PK/GSI2SK**: Date-based queries
- **GSI3PK/GSI3SK**: Status-based queries
- **Type**: Entity type identifier
- **Data**: Entity-specific attributes (Map)

### Entity Patterns

#### Customers
```
PK: CUSTOMER#${customerId}
SK: METADATA
GSI1PK: EMAIL#${email}
Data: {
  firstName, lastName, email, phone,
  address, stripeCustomerId, paymentMethodId,
  status, createdAt, updatedAt
}
```

#### Packages
```
PK: PACKAGE#${packageId}
SK: METADATA
GSI1PK: CUSTOMER#${customerId}
GSI1SK: PACKAGE#${packageId}
GSI2PK: DATE#${receivedDate}
GSI2SK: PACKAGE#${packageId}
GSI3PK: STATUS#${status}
GSI3SK: PACKAGE#${packageId}
Data: {
  dimensions, weight, tracking, carrier,
  labelUrl, status, loadId, invoiceId,
  shipTo, quotedRates, actualRate,
  createdAt, updatedAt
}
```

#### Loads
```
PK: LOAD#${loadId}
SK: METADATA
GSI2PK: DATE#${departureDate}
Data: {
  departureDate, arrivalDate, mode,
  vehicleId, driverName, status,
  manifestUrl, gpsTracking, packages[]
}
```

#### Invoices
```
PK: INVOICE#${invoiceId}
SK: METADATA
GSI1PK: CUSTOMER#${customerId}
GSI1SK: INVOICE#${invoiceId}
Data: {
  packageId, amount, tax, total,
  stripePaymentIntentId, status,
  pdfUrl, createdAt, paidAt
}
```

#### Notification Settings
```
PK: SETTINGS#NOTIFICATIONS
SK: INSTANCE#${environment}
Data: {
  email: { enabled, addresses[] },
  sms: { enabled, numbers[] },
  triggers: { paymentFailed, labelFailed, etc }
}
```

## API Specification

### Authentication Endpoints
- `POST /auth/login` - Staff/customer login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token
- `POST /auth/forgot-password` - Initiate reset

### Customer Endpoints
- `POST /customers` - Create customer
- `GET /customers` - List customers (staff)
- `GET /customers/{id}` - Get customer details
- `PUT /customers/{id}` - Update customer
- `POST /customers/{id}/setup-payment` - Create Stripe setup session

### Package Endpoints
- `POST /packages` - Create package (staff)
- `GET /packages` - List packages (filtered)
- `GET /packages/{id}` - Get package details
- `POST /packages/{id}/quote` - Get shipping rates
- `POST /packages/{id}/purchase-label` - Buy label
- `POST /packages/{id}/charge` - Process payment
- `GET /packages/{id}/tracking` - Get tracking info
- `PUT /packages/{id}/status` - Update status

### Load Endpoints
- `POST /loads` - Create load
- `GET /loads` - List loads
- `GET /loads/{id}` - Get load details
- `PUT /loads/{id}` - Update load
- `POST /loads/{id}/assign-packages` - Assign packages
- `GET /loads/{id}/manifest` - Generate manifest
- `POST /loads/{id}/gps` - Update GPS position

### Invoice Endpoints
- `GET /invoices` - List invoices
- `GET /invoices/{id}` - Get invoice details
- `POST /invoices/{id}/retry-payment` - Retry failed payment
- `POST /invoices/{id}/refund` - Process refund

### Webhook Endpoints
- `POST /webhooks/stripe` - Stripe events
- `POST /webhooks/shipstation` - ShipStation events

### Admin Endpoints
- `GET /admin/settings` - Get settings
- `PUT /admin/settings` - Update settings
- `GET /admin/reports` - Generate reports
- `POST /admin/carriers` - Configure carriers

## Business Rules

### Package Intake
1. Staff creates package with dimensions and weight (required)
2. Address validation performed with Canada Post API
3. Manual override allowed for unrecognized addresses
4. Customer must have valid payment method on file

### Rate Shopping
1. Query all available carriers via ShipStation
2. Display all options with cheapest and fastest highlighted
3. Apply markup: (base_rate * percentage) + dollar_amount per carrier/service
4. Show customer: final price + tax, retail comparison

### Label Purchase
1. Staff selects rate option or system auto-selects cheapest
2. Label purchased via ShipStation API
3. PDF stored in S3 with session-based access
4. Package status updated to "Ready"

### Payment Processing
1. Charge triggered immediately on label purchase
2. Create Stripe PaymentIntent with off-session flag
3. On success: mark invoice paid, send confirmation
4. On failure: mark failed, send payment link to customer

### Load Planning
1. AI suggests optimal package grouping by postal code
2. Staff confirms or manually adjusts assignments
3. System generates manifest PDF
4. Driver receives mobile web link for updates

### Tracking Updates
1. Poll ShipStation every 5 minutes for status changes
2. Update package status in database
3. Send notifications based on customer preferences
4. Update live map for customer portal

### Refund Policy
1. Manual approval required for all refunds
2. Void label in ShipStation first
3. Process Stripe refund
4. Update invoice status

## Security Requirements

### Authentication
- JWT with 24-hour access tokens
- 30-day refresh tokens stored securely
- Role-based access control (RBAC)
- MFA optional for staff accounts

### Data Protection
- All API endpoints use HTTPS
- PII encrypted at rest in DynamoDB
- S3 files accessed via presigned URLs
- Session-based file access control

### Rate Limiting
- 200 requests per minute per IP
- Stricter limits for unauthenticated endpoints
- Exponential backoff for repeated failures

### Compliance
- PCI compliance via Stripe (no raw card data)
- PIPEDA compliance for Canadian privacy
- Audit logs for all data modifications

## Infrastructure

### AWS Resources
- DynamoDB tables (dev, staging, prod)
- S3 buckets for files
- Lambda functions for background jobs
- SQS queues for async processing
- CloudWatch for logging/monitoring
- Secrets Manager for API keys
- Parameter Store for configuration

### Deployment Strategy
- Feature branches auto-deploy to dev
- Manual promotion to staging
- Manual promotion to production
- Blue-green deployments for zero downtime

### Backup & Recovery
- DynamoDB point-in-time recovery enabled
- S3 versioning for all files
- Daily CloudWatch log exports
- 30-day retention for all backups

## Development Workflow

### Local Development
1. Docker Compose for local services
2. Connect to AWS DynamoDB dev tables
3. Use Stripe/ShipStation test modes
4. Hot reload for frontend/backend

### Git Workflow
1. Feature branches from main
2. PR required for merge
3. Automated tests must pass
4. Code review required

### CI/CD Pipeline
1. On push: lint, type check, unit tests
2. On PR: integration tests, E2E tests
3. On merge to main: deploy to dev
4. Manual trigger: deploy to staging/prod

## Testing Strategy

### Unit Tests (Jest)
- Minimum 80% code coverage
- All business logic functions
- Database operations
- API endpoint handlers

### Integration Tests
- API endpoint flows
- Database transactions
- External API mocking
- Authentication flows

### E2E Tests (Playwright)
- Staff: Package intake → Quote → Label → Charge
- Customer: Login → View packages → Track → Pay
- Driver: Login → View manifest → Update status
- Admin: Settings → Reports → User management

### Load Tests
- Verify 200 req/min capacity
- Test database scaling
- Monitor response times
- Check error rates

## Documentation

### API Documentation
- OpenAPI 3.0 specification
- Available at `/docs/api`
- Interactive Swagger UI
- Auto-generated from code

### Business Documentation
- Available at `/docs/business`
- Workflows and processes
- User guides
- Admin procedures

### Change History
- Available at `/docs/changes`
- Links to plan files
- Implementation dates
- Version tracking

## Performance Requirements

### Response Times
- API endpoints: < 200ms p95
- Page loads: < 3s initial, < 1s subsequent
- Database queries: < 50ms p95
- File uploads: < 10s for 10MB

### Scalability
- Support 1000 concurrent users
- Handle 10,000 packages/day
- Store 1M records initially
- Scale to 10M records

### Availability
- 99.9% uptime target
- < 5 min recovery time
- Graceful degradation
- Automatic failover

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Project setup and structure
- Database schema and models
- Authentication system
- Basic CRUD operations

### Phase 2: Integrations (Week 2)
- Stripe payment setup
- ShipStation API integration
- Notification service
- File management

### Phase 3: Staff Portal (Week 3)
- Package management UI
- Customer management
- Load planning interface
- Billing dashboard

### Phase 4: Customer Portal (Week 4)
- Authentication flow
- Package tracking
- Invoice management
- Payment processing

### Phase 5: Driver & Polish (Week 5)
- Driver mobile interface
- GPS tracking
- Documentation site
- Performance optimization

## Success Metrics

### Technical Metrics
- Zero critical bugs in production
- < 1% error rate on API calls
- All tests passing (>80% coverage)
- < 200ms API response time

### Business Metrics
- Process 100 packages in first week
- < 2% payment failure rate
- 90% on-time delivery tracking
- < 5 min staff training time

## Risk Mitigation

### Technical Risks
- **API rate limits**: Implement queuing and caching
- **Payment failures**: Retry logic and manual fallback
- **Data loss**: Automated backups and recovery
- **Security breach**: Regular audits and monitoring

### Business Risks
- **Carrier API changes**: Abstract behind interface
- **Regulatory changes**: Flexible rule engine
- **Scale issues**: Cloud-native architecture
- **User adoption**: Intuitive UI and training

## Test Assertions

### Authentication & Authorization
- [ ] User can login with valid credentials
- [ ] Invalid credentials return appropriate error
- [ ] JWT access token expires after 24 hours
- [ ] Refresh token works for 30 days
- [ ] Expired refresh token requires re-login
- [ ] Staff users can access staff-only endpoints
- [ ] Customers cannot access staff endpoints
- [ ] Unauthenticated requests are rejected
- [ ] Rate limiting enforces 200 req/min per IP
- [ ] Session-based S3 access control works

### Customer Management
- [ ] Staff can create new customer
- [ ] Email validation prevents duplicates
- [ ] Stripe customer ID is created successfully
- [ ] Payment setup link is sent via email
- [ ] Webhook updates payment method ID
- [ ] Customer status can be updated
- [ ] Customer search works by name/email
- [ ] Customer details show package history
- [ ] Customer portal shows only own data
- [ ] Customer can update contact info

### Package Intake
- [ ] Package requires all dimensions and weight
- [ ] Customer CID must be valid
- [ ] Address validation with Canada Post works
- [ ] Invalid addresses can be manually overridden
- [ ] Package ID is generated uniquely
- [ ] Package status defaults to "Unlabeled"
- [ ] Created timestamp is set automatically
- [ ] Staff can edit package details
- [ ] Barcode is generated/stored correctly
- [ ] Package appears in customer's list

### Rate Shopping
- [ ] ShipStation API returns rates successfully
- [ ] All available carriers are displayed
- [ ] Cheapest option is highlighted
- [ ] Fastest option is highlighted
- [ ] Markup calculation is correct (% + $)
- [ ] Tax calculation is correct
- [ ] Retail comparison shows savings
- [ ] Quoted rates are stored in database
- [ ] Rate quotes expire after 24 hours
- [ ] Error handling for API failures

### Label Purchase
- [ ] Label purchase creates tracking number
- [ ] Label PDF is stored in S3
- [ ] Label URL requires authentication
- [ ] Package status updates to "Ready"
- [ ] ShipStation order is created
- [ ] Carrier information is stored
- [ ] Label can be voided within 24 hours
- [ ] Void triggers refund process
- [ ] Multiple labels cannot be purchased
- [ ] Purchase failure is handled gracefully

### Payment Processing
- [ ] Payment Intent created on label purchase
- [ ] Off-session charging works
- [ ] Successful payment updates invoice
- [ ] Failed payment sends notification
- [ ] Failed payment generates payment link
- [ ] Customer can retry failed payment
- [ ] Refund process works correctly
- [ ] Invoice PDF is generated
- [ ] Payment history is tracked
- [ ] Stripe webhooks are processed

### Load Management
- [ ] Load can be created with departure date
- [ ] Packages can be assigned to load
- [ ] AI suggests optimal package grouping
- [ ] Manual override of AI suggestions works
- [ ] Manifest PDF is generated correctly
- [ ] Load status transitions properly
- [ ] GPS tracking updates in real-time
- [ ] Driver can update package status
- [ ] Load capacity limits are enforced
- [ ] Multiple loads can be managed

### Tracking Updates
- [ ] Polling runs every 5 minutes
- [ ] Status updates are reflected in DB
- [ ] Customer receives notifications
- [ ] Live map shows current position
- [ ] Delivery confirmation is recorded
- [ ] Exception handling for delays
- [ ] ETA calculations are accurate
- [ ] Tracking history is maintained
- [ ] Multiple tracking events handled
- [ ] Webhook updates work (if available)

### Notifications
- [ ] Email notifications send successfully
- [ ] SMS notifications send for critical events
- [ ] Notification preferences are respected
- [ ] Multiple recipients receive notifications
- [ ] Notification settings persist per environment
- [ ] Failed notifications are retried
- [ ] Unsubscribe mechanism works
- [ ] Templates render correctly
- [ ] Attachments (PDFs) are included
- [ ] Notification history is logged

### Reporting & Analytics
- [ ] Dashboard shows key metrics
- [ ] Package volume chart is accurate
- [ ] Revenue reports calculate correctly
- [ ] Failed payment alerts display
- [ ] Customer analytics are available
- [ ] Carrier performance metrics work
- [ ] Export to CSV/PDF functions
- [ ] Date range filtering works
- [ ] Real-time updates on dashboard
- [ ] Historical data is retained

### Driver Interface
- [ ] Mobile web interface is responsive
- [ ] Driver can login with credentials
- [ ] Manifest displays assigned packages
- [ ] Package scanning/update works
- [ ] GPS location updates automatically
- [ ] Offline capability with sync
- [ ] Signature capture works
- [ ] Photo upload for proof
- [ ] Route optimization displays
- [ ] Driver notes can be added

### Documentation Site
- [ ] OpenAPI spec is auto-generated
- [ ] Swagger UI is accessible at /docs/api
- [ ] Business rules documented at /docs/business
- [ ] Change history at /docs/changes
- [ ] Search functionality works
- [ ] Navigation is intuitive
- [ ] Examples are provided
- [ ] Authentication documented
- [ ] Versioning is tracked
- [ ] Updates trigger regeneration

### Infrastructure & DevOps
- [ ] GitHub Actions pipeline runs on push
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests complete successfully
- [ ] E2E tests pass in Playwright
- [ ] Deployment to dev is automatic
- [ ] Environment variables are set correctly
- [ ] Secrets are stored securely
- [ ] Monitoring alerts are configured
- [ ] Logs are aggregated in CloudWatch
- [ ] Backup recovery has been tested

### Performance
- [ ] API responses < 200ms p95
- [ ] Page loads < 3s initial
- [ ] Database queries < 50ms p95
- [ ] 200 req/min load handling
- [ ] No memory leaks detected
- [ ] CPU usage remains stable
- [ ] Database connections pooled
- [ ] Caching reduces API calls
- [ ] CDN serves static assets
- [ ] Compression is enabled

### Security
- [ ] SQL injection is prevented
- [ ] XSS attacks are blocked
- [ ] CSRF protection is enabled
- [ ] Headers are properly set
- [ ] HTTPS is enforced
- [ ] Passwords are hashed (bcrypt)
- [ ] API keys are not exposed
- [ ] File uploads are validated
- [ ] Rate limiting prevents abuse
- [ ] Audit logs capture changes

### Error Handling
- [ ] 404 pages display correctly
- [ ] 500 errors are logged
- [ ] API errors return proper codes
- [ ] Validation errors are clear
- [ ] Network failures are retried
- [ ] Database errors are handled
- [ ] Third-party API failures graceful
- [ ] User sees friendly messages
- [ ] Stack traces are hidden
- [ ] Recovery procedures work

### Data Integrity
- [ ] Unique constraints enforced
- [ ] Foreign key relationships valid
- [ ] Transactions maintain consistency
- [ ] Concurrent updates handled
- [ ] Soft deletes preserve history
- [ ] Data migrations are reversible
- [ ] Backup restoration works
- [ ] Data export is complete
- [ ] Import validation works
- [ ] Deduplication is automatic

## Change Log
- **2025-08-13**: Initial plan created