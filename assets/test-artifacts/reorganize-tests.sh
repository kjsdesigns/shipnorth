#!/bin/bash

# Playwright Test Reorganization Script
# This script moves old redundant test files to backup and sets up the new modular structure

echo "🚀 Starting Playwright test reorganization..."

# Create backup directory
mkdir -p tests/e2e/backup-original

# Define arrays of files to move to backup
DEBUG_FILES=(
    "admin-debug.spec.ts"
    "dev-site-verification.spec.ts"
    "dev-verification-final.spec.ts"
    "final-verification.spec.ts"
    "layout-debug.spec.ts"
    "login-debug.spec.ts"
    "manual-check.spec.ts"
    "quick-nav-test.spec.ts"
    "test-localhost.spec.ts"
)

THEME_FILES=(
    "login-theme.spec.ts"
    "theme-toggle.spec.ts"
    "ui-theme.spec.ts"
)

CONSOLIDATED_FILES=(
    "basic-auth.spec.ts"
    "comprehensive-auth.spec.ts"
    "customer-auth.spec.ts"
    "comprehensive-staff.spec.ts"
    "staff-comprehensive-test.spec.ts"
    "staff-loads.spec.ts"
    "staff-packages.spec.ts"
    "comprehensive-customer.spec.ts"
    "customer-portal.spec.ts"
    "customer-registration.spec.ts"
    "customer-tracking.spec.ts"
    "comprehensive-driver.spec.ts"
    "driver-mobile.spec.ts"
    "driver-portal.spec.ts"
    "gps-tracking.spec.ts"
    "package-scanning.spec.ts"
    "photo-upload.spec.ts"
    "signature-capture.spec.ts"
    "manifest-display.spec.ts"
    "comprehensive-admin.spec.ts"
    "user-management.spec.ts"
    "comprehensive-docs.spec.ts"
    "documentation.spec.ts"
    "global-search.spec.ts"
    "comprehensive-global-search.spec.ts"
    "api-comprehensive.spec.ts"
    "api-health.spec.ts"
    "comprehensive-integration.spec.ts"
    "comprehensive-visual-accessibility.spec.ts"
    "login-logo.spec.ts"
    "end-to-end-workflows.spec.ts"
    "complete-workflow-test.spec.ts"
    "fixed-workflow-test.spec.ts"
    "web-interface.spec.ts"
)

# Function to move files if they exist
move_files() {
    local category=$1
    shift
    local files=("$@")
    
    echo "📁 Moving $category files to backup..."
    
    for file in "${files[@]}"; do
        if [ -f "tests/e2e/$file" ]; then
            echo "  📦 Moving $file"
            mv "tests/e2e/$file" "tests/e2e/backup-original/"
        else
            echo "  ⚠️  $file not found (may already be moved)"
        fi
    done
}

# Move files to backup
move_files "debug" "${DEBUG_FILES[@]}"
move_files "theme-only" "${THEME_FILES[@]}"
move_files "consolidated" "${CONSOLIDATED_FILES[@]}"

echo ""
echo "📊 Reorganization Summary:"
echo "=========================================="

# Count files in backup
backup_count=$(ls -1 tests/e2e/backup-original/*.spec.ts 2>/dev/null | wc -l)
echo "📦 Files moved to backup: $backup_count"

# Count remaining test files (exclude non-test files)
remaining_count=$(ls -1 tests/e2e/*.spec.ts 2>/dev/null | wc -l)
echo "🧪 Active test files: $remaining_count"

echo ""
echo "✅ New Modular Test Structure:"
echo "=========================================="

# List the modular test files
for test_file in tests/e2e/*.spec.ts; do
    if [ -f "$test_file" ]; then
        filename=$(basename "$test_file")
        case "$filename" in
            auth.spec.ts)
                echo "🔐 $filename - Authentication (all user roles)"
                ;;
            staff-interface.spec.ts)
                echo "👨‍💼 $filename - Staff dashboard and functionality"
                ;;
            customer-portal*.spec.ts)
                echo "👤 $filename - Customer portal and tracking"
                ;;
            driver-mobile*.spec.ts)
                echo "🚛 $filename - Driver mobile interface"
                ;;
            admin-panel.spec.ts)
                echo "⚙️ $filename - Admin panel and user management"
                ;;
            documentation.spec.ts)
                echo "📚 $filename - Documentation and search"
                ;;
            api-integration.spec.ts)
                echo "🔌 $filename - API functionality and health"
                ;;
            ui-ux.spec.ts)
                echo "🎨 $filename - Theme, accessibility, and UX"
                ;;
            end-to-end.spec.ts)
                echo "🔄 $filename - Complete business workflows"
                ;;
            *)
                echo "❓ $filename - Other test file"
                ;;
        esac
    fi
done

echo ""
echo "📋 Next Steps:"
echo "=========================================="
echo "1. Run tests with: npm run test:e2e"
echo "2. Run specific test: npx playwright test auth.spec.ts"
echo "3. View HTML report: npx playwright show-report"
echo "4. Restore file if needed: mv tests/e2e/backup-original/[filename] tests/e2e/"

echo ""
echo "🎉 Reorganization complete!"
echo "   - Reduced from 43+ files to ~9 focused test suites"
echo "   - Eliminated duplicate test coverage"
echo "   - Added shared utility functions"
echo "   - Enabled parallel test execution"
echo "   - Improved maintainability and performance"