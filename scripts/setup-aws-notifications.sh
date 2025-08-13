#!/bin/bash

# AWS SES and SNS Setup Script for Shipnorth
# This script helps configure AWS services for email and SMS notifications

set -e

echo "🚀 Shipnorth AWS Notification Services Setup"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI first: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "📝 Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region)
    echo "   Account: $ACCOUNT_ID"
    echo "   Region: $REGION"
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

echo ""
echo "📧 Setting up Amazon SES (Simple Email Service)"
echo "------------------------------------------------"

# Function to verify email address
verify_email() {
    local email=$1
    echo "Verifying email: $email"
    
    # Check if already verified
    if aws ses get-identity-verification-attributes --identities "$email" --query "VerificationAttributes.\"$email\".VerificationStatus" --output text 2>/dev/null | grep -q "Success"; then
        echo -e "${GREEN}✅ Email already verified${NC}"
    else
        # Send verification email
        aws ses verify-email-identity --email-address "$email"
        echo -e "${YELLOW}📬 Verification email sent to $email${NC}"
        echo "   Please check your inbox and click the verification link"
    fi
}

# Get sender email
echo ""
read -p "Enter the FROM email address for notifications (e.g., noreply@shipnorth.com): " FROM_EMAIL
verify_email "$FROM_EMAIL"

# Optional: Verify domain for better deliverability
echo ""
read -p "Do you want to verify your entire domain for better deliverability? (y/n): " VERIFY_DOMAIN
if [[ $VERIFY_DOMAIN == "y" ]]; then
    read -p "Enter your domain (e.g., shipnorth.com): " DOMAIN
    
    echo "Verifying domain: $DOMAIN"
    VERIFICATION_TOKEN=$(aws ses verify-domain-identity --domain "$DOMAIN" --query VerificationToken --output text)
    
    echo -e "${YELLOW}Add this TXT record to your DNS:${NC}"
    echo "   Name: _amazonses.$DOMAIN"
    echo "   Type: TXT"
    echo "   Value: $VERIFICATION_TOKEN"
    echo ""
    
    # Also set up DKIM for better deliverability
    echo "Setting up DKIM..."
    aws ses put-identity-dkim --identity "$DOMAIN" --dkim-enabled
    DKIM_TOKENS=$(aws ses get-identity-dkim-attributes --identities "$DOMAIN" --query "DkimAttributes.\"$DOMAIN\".DkimTokens" --output text)
    
    echo -e "${YELLOW}Add these CNAME records to your DNS for DKIM:${NC}"
    for token in $DKIM_TOKENS; do
        echo "   Name: ${token}._domainkey.$DOMAIN"
        echo "   Type: CNAME"
        echo "   Value: ${token}.dkim.amazonses.com"
        echo ""
    done
fi

# Check SES sending quota
echo ""
echo "📊 Checking SES sending limits..."
QUOTA=$(aws ses get-send-quota --output json)
SEND_RATE=$(echo $QUOTA | jq -r '.MaxSendRate')
DAILY_QUOTA=$(echo $QUOTA | jq -r '.Max24HourSend')

if [[ "$DAILY_QUOTA" == "200" ]]; then
    echo -e "${YELLOW}⚠️  SES is in Sandbox Mode${NC}"
    echo "   Daily limit: 200 emails"
    echo "   Can only send to verified emails"
    echo ""
    echo "To request production access:"
    echo "1. Go to AWS Console → SES → Account dashboard"
    echo "2. Click 'Request production access'"
    echo "3. Fill out the form explaining Shipnorth use case"
else
    echo -e "${GREEN}✅ SES in Production Mode${NC}"
    echo "   Daily limit: $DAILY_QUOTA emails"
    echo "   Send rate: $SEND_RATE emails/second"
fi

echo ""
echo "📱 Setting up Amazon SNS (Simple Notification Service)"
echo "------------------------------------------------------"

# Check SMS spending limit
echo "Checking SMS configuration..."
SMS_ATTRS=$(aws sns get-sms-attributes --output json 2>/dev/null || echo "{}")

if [[ -z "$SMS_ATTRS" ]] || [[ "$SMS_ATTRS" == "{}" ]]; then
    echo "Setting up SMS preferences..."
    
    # Set default SMS preferences
    aws sns set-sms-attributes --attributes \
        DefaultSMSType=Transactional \
        DefaultSenderID=SHIPNORTH \
        MonthlySpendLimit=100 \
        DeliveryStatusIAMRole=arn:aws:iam::${ACCOUNT_ID}:role/SNSSuccessFeedback \
        DeliveryStatusSuccessSamplingRate=100 \
        UsageReportS3Bucket=""
    
    echo -e "${GREEN}✅ SMS preferences configured${NC}"
else
    SPEND_LIMIT=$(echo $SMS_ATTRS | jq -r '.attributes.MonthlySpendLimit // "1"')
    echo -e "${GREEN}✅ SMS already configured${NC}"
    echo "   Monthly spend limit: \$$SPEND_LIMIT"
fi

# Create SNS topic for notifications (optional)
echo ""
read -p "Create SNS topic for notification events? (y/n): " CREATE_TOPIC
if [[ $CREATE_TOPIC == "y" ]]; then
    TOPIC_NAME="shipnorth-notifications"
    TOPIC_ARN=$(aws sns create-topic --name "$TOPIC_NAME" --query TopicArn --output text)
    echo -e "${GREEN}✅ SNS topic created: $TOPIC_ARN${NC}"
fi

echo ""
echo "🔐 Creating IAM policy for Shipnorth"
echo "------------------------------------"

# Create IAM policy
POLICY_NAME="ShipnorthNotificationPolicy"
POLICY_DOCUMENT='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:SendTemplatedEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    }
  ]
}'

# Check if policy exists
if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}" &> /dev/null; then
    echo -e "${GREEN}✅ IAM policy already exists${NC}"
else
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document "$POLICY_DOCUMENT" \
        --description "Policy for Shipnorth to send emails via SES and SMS via SNS"
    echo -e "${GREEN}✅ IAM policy created${NC}"
fi

echo ""
echo "📝 Environment Variables for Shipnorth"
echo "--------------------------------------"
echo ""
echo "Add these to your .env file:"
echo ""
echo -e "${YELLOW}# AWS Notification Services"
echo "AWS_REGION=$REGION"
echo "SES_FROM_EMAIL=$FROM_EMAIL"
echo "SNS_DEFAULT_SENDER_ID=SHIPNORTH"
echo ""
echo "# Optional: If using IAM user instead of role"
echo "# AWS_ACCESS_KEY_ID=your-key"
echo "# AWS_SECRET_ACCESS_KEY=your-secret${NC}"

echo ""
echo "📚 Testing Commands"
echo "------------------"
echo ""
echo "Test email sending:"
echo -e "${YELLOW}aws ses send-email \\"
echo "  --from $FROM_EMAIL \\"
echo "  --to your-email@example.com \\"
echo "  --subject 'Shipnorth Test' \\"
echo "  --text 'This is a test email from Shipnorth'${NC}"
echo ""
echo "Test SMS sending:"
echo -e "${YELLOW}aws sns publish \\"
echo "  --phone-number +1234567890 \\"
echo "  --message 'Shipnorth: Test SMS notification'${NC}"

echo ""
echo -e "${GREEN}✅ AWS Notification Services setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify your email address by clicking the link in your inbox"
echo "2. Add the environment variables to your .env file"
echo "3. Test the notification service"
echo "4. Request SES production access if still in sandbox"

# Create a test script
echo ""
read -p "Create a test script for notifications? (y/n): " CREATE_TEST
if [[ $CREATE_TEST == "y" ]]; then
    cat > test-notifications.js << 'EOF'
#!/usr/bin/env node

const { NotificationService } = require('./apps/api/dist/services/notifications');

async function test() {
  console.log('Testing Shipnorth Notifications...\n');
  
  // Test data
  const customer = {
    firstName: 'Test',
    lastName: 'User',
    email: process.argv[2] || 'test@example.com',
    phone: process.argv[3] || null,
  };
  
  const packageData = {
    barcode: 'PKG-TEST-001',
    trackingNumber: 'TRACK-123456',
    weight: 5.5,
    length: 30,
    width: 20,
    height: 15,
    shipTo: {
      name: 'John Doe',
      city: 'Toronto',
      province: 'ON',
    },
  };
  
  try {
    console.log(`Sending test email to: ${customer.email}`);
    if (customer.phone) {
      console.log(`Sending test SMS to: ${customer.phone}`);
    }
    
    await NotificationService.notifyPackageCreated(customer, packageData);
    console.log('✅ Notifications sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF
    chmod +x test-notifications.js
    echo -e "${GREEN}✅ Test script created: test-notifications.js${NC}"
    echo "Usage: node test-notifications.js email@example.com +1234567890"
fi