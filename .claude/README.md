# Claude Code Hooks

This directory contains Claude Code hooks that protect the Shipnorth project from common mistakes.

## Active Protections

### 🛡️ Tailwind CSS Protection (`protect-tailwind.js`)

**Purpose**: Prevents destruction of the beautiful Tailwind CSS theme that was previously broken by well-intentioned "fixes".

**What it protects**:
- `apps/web/app/globals.css` - Must contain Tailwind directives
- `apps/web/tailwind.config.js` - Must be valid configuration  
- `apps/web/postcss.config.js` - Must be valid PostCSS config

**Triggers on**:
- Commenting out `@tailwind` directives
- Adding dangerous patterns like "Temporarily disable Tailwind"
- Removing or corrupting Tailwind configuration

**When it runs**:
- **Pre-edit**: Before any changes to protected CSS files
- **Post-edit**: After any changes to verify integrity

**What happens when triggered**:
1. Blocks the destructive change
2. Shows clear error message explaining the issue
3. Provides specific fix instructions
4. Preserves the beautiful theme styling

## Historical Context

The beautiful Shipnorth theme was destroyed in commit `48b1c9d` when Tailwind CSS was replaced with incomplete custom CSS to "fix build issues". This resulted in:
- Broken spacing and margins
- Missing colors and styling
- Poor user experience
- Hours of work to restore

These hooks prevent this from happening again by protecting the core theme files.

## Usage

The hooks run automatically when Claude Code detects changes to protected files. No manual intervention required - they work silently to maintain theme integrity.