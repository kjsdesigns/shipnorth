# Shipnorth CSS Standards & Style Guide

## 🎯 Overview

This document outlines the standardized CSS patterns and component usage for the Shipnorth application. Following these standards ensures visual consistency, maintainability, and a cohesive user experience across all portals.

## 📦 Component Library

### Core Components

Use these standardized components instead of writing custom styles:

```typescript
// Import standardized components
import { Button, Input, Card, Badge, Alert } from '@/components/ui';

// Example Usage
<Card>
  <Card.Header>
    <h2>Title</h2>
  </Card.Header>
  <Card.Content>
    <Input label="Name" placeholder="Enter name" />
    <Button variant="primary">Submit</Button>
  </Card.Content>
</Card>
```

### Available Components

- **Button**: `primary` | `secondary` | `outline` | `ghost` | `danger`
- **Input**: Form inputs with built-in error states
- **Card**: Container with Header, Content, Footer sections
- **Badge**: Status indicators with semantic colors
- **Alert**: Success, error, warning, info messages
- **DataTable**: Standardized data tables with sorting/filtering

## 🎨 Design System

### Color Palette

#### Primary Colors
- **Actions**: `blue-600` / `blue-700` (hover)
- **Success**: `green-600` / `green-400` (dark)
- **Error**: `red-600` / `red-400` (dark)
- **Warning**: `orange-600` / `orange-400` (dark)
- **Info**: `purple-600` / `purple-400` (dark)

#### Neutral Colors
- **Surface**: `white` / `gray-800` (dark)
- **Border**: `gray-200` / `gray-700` (dark)
- **Text Primary**: `gray-900` / `white` (dark)
- **Text Secondary**: `gray-600` / `gray-400` (dark)

### Typography

```css
/* Headers */
.text-3xl.font-bold     /* Page titles */
.text-xl.font-semibold  /* Section headers */
.text-lg.font-medium    /* Subsection headers */

/* Body Text */
.text-base              /* Large body text */
.text-sm                /* Default body text */
.text-xs                /* Captions, labels */

/* Form Labels */
.text-sm.font-medium                                    /* Standard labels */
.text-xs.font-medium.uppercase.tracking-wider         /* Table headers */
```

### Spacing

```css
/* Container Padding */
.p-6                    /* Main card content */
.p-4                    /* Section content */
.p-3                    /* Compact areas */

/* Element Spacing */
.space-y-6             /* Between major sections */
.space-y-4             /* Between elements */
.space-x-2             /* Between inline elements */
```

### Border Radius

```css
.rounded-xl            /* Cards (0.75rem) */
.rounded-lg            /* Buttons, inputs (0.5rem) */
.rounded              /* Small elements (0.25rem) */
```

## 🏗️ Standard Patterns

### Card Container Pattern

```typescript
// ✅ CORRECT - Standardized Card
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  {/* Content */}
</div>

// ❌ AVOID - Inconsistent styling
<div className="bg-white p-4 rounded shadow-lg">
```

### Button Pattern

```typescript
// ✅ CORRECT - Use Button component
<Button variant="primary" size="md">
  Save Changes
</Button>

// ❌ AVOID - Custom button styling
<button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white">
  Save Changes
</button>
```

### Form Pattern

```typescript
// ✅ CORRECT - Use Input component
<Input 
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
/>

// ❌ AVOID - Custom form styling
<div>
  <label className="text-gray-700">Email</label>
  <input className="border rounded p-2 w-full" />
</div>
```

### Status Badge Pattern

```typescript
// ✅ CORRECT - Use Badge component
<Badge variant="success">Active</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="warning">Pending</Badge>

// ❌ AVOID - Inline status styling
<span className="bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
```

## ✅ Best Practices

### 1. Component Consistency
- Always use standardized components from `/components/ui`
- Avoid creating custom button/input/card styles
- Use the provided variant and size props

### 2. Dark Mode Support
- Every component must support both light and dark modes
- Use the pattern: `class dark:class` for all styling
- Test components in both modes

### 3. Responsive Design
- Use mobile-first responsive classes: `sm:` `md:` `lg:` `xl:`
- Ensure touch-friendly sizing on mobile (min 44px touch targets)
- Test on multiple screen sizes

### 4. Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Maintain color contrast ratios
- Support keyboard navigation

### 5. Performance
- Minimize custom CSS
- Use Tailwind utilities over custom styles
- Avoid deeply nested selectors

## 🚫 Anti-Patterns

### Don't Do This:

```typescript
// ❌ Hard-coded colors
<div className="bg-gray-800 text-white">

// ❌ Inconsistent spacing
<div className="p-3 m-2">

// ❌ Missing dark mode
<div className="bg-white text-black">

// ❌ Inline styles
<div style={{ padding: '16px', backgroundColor: '#f3f4f6' }}>

// ❌ Custom button classes
<button className="custom-blue-button">
```

### Do This Instead:

```typescript
// ✅ Standardized patterns
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ✅ Consistent spacing
<div className="p-6 space-y-4">

// ✅ Dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ✅ Tailwind utilities
<div className="p-4 bg-gray-50 dark:bg-gray-700">

// ✅ Standardized components
<Button variant="primary">Action</Button>
```

## 🔧 Migration Guide

### Updating Existing Components

1. **Identify inconsistent patterns**: Look for custom styling that doesn't match standards
2. **Replace with standardized components**: Use Button, Input, Card, etc.
3. **Update color patterns**: Ensure dark mode support
4. **Standardize spacing**: Use consistent padding/margin patterns
5. **Test thoroughly**: Verify visual consistency across portals

### Quick Wins

- Replace `shadow-lg` with `shadow-sm` for consistency
- Update `rounded` to `rounded-lg` or `rounded-xl` based on context
- Standardize button padding to `px-4 py-2` pattern
- Add `transition-colors` to all interactive elements

## 🎯 Goals Achieved

1. **Visual Consistency**: All components follow the same design patterns
2. **Maintainability**: Centralized styling makes updates easier
3. **Accessibility**: Built-in accessibility features in all components
4. **Dark Mode**: Complete theme support across all elements
5. **Performance**: Optimized Tailwind usage with minimal custom CSS

---

*For questions or suggestions, refer to the design system documentation or create a GitHub issue.*