# Shipnorth Design System Standards

## Color Palette

### Primary Colors
- **Primary**: `blue-600` (#2563eb) - Actions, links, focus states
- **Primary Hover**: `blue-700` (#1d4ed8) - Hover states
- **Primary Light**: `blue-50` (#eff6ff) - Subtle backgrounds

### Neutral Colors
- **Background**: `white` / `gray-800` (dark)
- **Surface**: `white` / `gray-800` (dark) - Cards, modals
- **Border**: `gray-200` / `gray-700` (dark)
- **Text Primary**: `gray-900` / `white` (dark)
- **Text Secondary**: `gray-600` / `gray-400` (dark)
- **Text Tertiary**: `gray-500` / `gray-500` (dark)

### Status Colors
- **Success**: `green-600` / `green-400` (dark)
- **Error**: `red-600` / `red-400` (dark)
- **Warning**: `orange-600` / `orange-400` (dark)
- **Info**: `purple-600` / `purple-400` (dark)

## Typography Scale

### Headers
- **H1**: `text-3xl font-bold` - Page titles
- **H2**: `text-xl font-semibold` - Section headers
- **H3**: `text-lg font-medium` - Subsection headers

### Body Text
- **Body Large**: `text-base` - Main content
- **Body**: `text-sm` - Default body text
- **Caption**: `text-xs` - Labels, captions

### Labels
- **Form Labels**: `text-sm font-medium`
- **Table Headers**: `text-xs font-medium uppercase tracking-wider`

## Component Standards

### Containers
```css
.card-base: bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
.container-padding: p-6
.section-spacing: space-y-6
```

### Buttons
```css
.btn-primary: bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors
.btn-secondary: border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
.btn-sm: px-3 py-1.5 text-sm
.btn-lg: px-6 py-3 text-base
```

### Form Elements
```css
.input-base: w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

## Spacing System

### Padding
- **Container**: `p-6` - Main card padding
- **Section**: `p-4` - Section padding
- **Compact**: `p-3` - Compact areas

### Margins
- **Section**: `mb-8` - Between major sections
- **Element**: `mb-4` - Between elements
- **Inline**: `space-x-2` - Between inline elements

## Border Radius

- **Cards**: `rounded-xl` (0.75rem)
- **Buttons**: `rounded-lg` (0.5rem)
- **Inputs**: `rounded-lg` (0.5rem)
- **Small Elements**: `rounded` (0.25rem)

## Shadows

- **Card**: `shadow-sm` - Default card shadow
- **Card Hover**: `shadow-md` - Hover state
- **Modal**: `shadow-xl` - Modal/dropdown shadow

## Transitions

- **Default**: `transition-colors` - Color transitions
- **All**: `transition-all duration-200` - Multiple properties
- **Hover**: Apply to all interactive elements