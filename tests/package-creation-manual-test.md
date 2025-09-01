# Package Creation Workflow - Manual Test Guide

## Overview
This document provides step-by-step manual testing instructions for the new two-step package creation workflow.

## Test Environment Setup
1. Ensure Docker services are running: `npm run dev`
2. Navigate to: http://localhost:8849/staff/packages
3. Login as staff user: staff@shipnorth.com / staff123

## Test Case 1: Complete Package Creation Workflow

### Expected Flow:
1. **Click "Add Package" button**
   - ✅ Should open Customer Selection dialog
   - ✅ Dialog title: "Select Customer for Package"
   - ✅ Search input should be visible and focused

2. **Search and Select Customer**
   - ✅ Type "Sarah" in search box
   - ✅ Should filter customers to show Sarah Thompson
   - ✅ Customer card should show: name, email, phone, city/province
   - ✅ Click on Sarah Thompson card

3. **Package Creation Dialog - Step 2**
   - ✅ Should open "Create Package" dialog
   - ✅ Should show "Step 2: Package Details" subtitle
   - ✅ Should display blue customer banner with Sarah Thompson info
   - ✅ Recipient name should be pre-populated with "Sarah Thompson"
   - ✅ Address fields should be pre-populated with customer data

4. **Fill Package Details**
   - ✅ Update address if needed:
     - Address Line 1: "123 Main Street"
     - Address Line 2: "Suite 456"
     - City: "Toronto"
     - Province: "ON"
     - Postal Code: "M5V 2T6"
   - ✅ Enter package dimensions:
     - Weight: 2.5 kg
     - Length: 20 cm
     - Width: 15 cm
     - Height: 10 cm
   - ✅ Enter description: "Electronic components for testing"
   - ✅ Enter declared value: $150
   - ✅ Enter special instructions: "Fragile - handle with care"

5. **Submit Package Creation**
   - ✅ Click "Create Package" button
   - ✅ Dialog should close automatically
   - ✅ Package list should refresh
   - ✅ New package should appear in the table

6. **Verify Package in List**
   - ✅ Package should show Sarah Thompson as customer
   - ✅ Recipient should be displayed correctly
   - ✅ Tracking number should be generated
   - ✅ Package should have "pending" status

7. **Test Package Edit Dialog**
   - ✅ Click on the tracking number to edit
   - ✅ Edit dialog should open
   - ✅ All data should be correctly populated:
     - Customer: Sarah Thompson
     - Recipient: Sarah Thompson
     - Address: 123 Main Street, Suite 456, Toronto, ON M5V 2T6
     - Dimensions: 2.5kg, 20x15x10cm
     - Description: "Electronic components for testing"

## Test Case 2: Navigation Controls

### Back Button Test:
1. Click "Add Package"
2. Search and select customer
3. Click "Back to Customer Selection" button
4. ✅ Should return to customer selection dialog
5. ✅ Search should be preserved

### Cancel Button Test:
1. Click "Add Package"
2. Click X (close) button
3. ✅ Dialog should close completely
4. Click "Add Package" → Select customer
5. Click X (close) button on package creation
6. ✅ Should close both dialogs

## Test Case 3: Error Handling

### Required Field Validation:
1. Start package creation flow
2. Select customer
3. Leave required fields empty
4. Click "Create Package"
5. ✅ Should show validation errors
6. ✅ Dialog should remain open

### Customer Search:
1. Click "Add Package"
2. Search for "NonExistentCustomer"
3. ✅ Should show "No customers found matching your search"

## Test Case 4: Pre-population Verification

### Customer Data Pre-population:
1. Select different customers with varying address data
2. ✅ Verify recipient name always matches customer name
3. ✅ Verify address fields populate when customer has address data
4. ✅ Verify empty fields when customer lacks address data
5. ✅ Verify user can override any pre-populated data

## Expected Results Summary

### ✅ **Core Functionality**
- Two-step package creation workflow
- Customer search and selection
- Data pre-population from customer
- Package creation and database storage
- Package display in list
- Edit dialog data verification

### ✅ **User Experience**
- Smooth navigation between steps
- Clear visual indicators for progress
- Intuitive customer selection interface
- Pre-populated forms save time
- Validation prevents errors

### ✅ **Data Integrity**
- Customer data correctly transferred
- Package data persisted in database
- Edit dialog shows accurate data
- All fields maintain proper types
- Foreign key relationships preserved

## Manual Test Results

**Date Tested:** [Date]
**Tester:** [Name]
**Environment:** Docker Development (localhost:8849)

| Test Case | Status | Notes |
|-----------|--------|-------|
| Complete Workflow | ✅ / ❌ | |
| Navigation Controls | ✅ / ❌ | |
| Error Handling | ✅ / ❌ | |
| Pre-population | ✅ / ❌ | |

## Issues Found
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

## Recommendations
- [ ] Recommendation 1: [Description]
- [ ] Recommendation 2: [Description]