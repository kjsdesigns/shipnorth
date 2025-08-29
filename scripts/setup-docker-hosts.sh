#!/bin/bash

# Shipnorth Docker Hosts Setup
# Configures clean domain mapping for Docker development

HOSTS_FILE="/etc/hosts"
DOMAINS=("sn.local.com" "snapi.local.com")
BACKUP_FILE="/etc/hosts.backup.$(date +%Y%m%d_%H%M%S)"

echo "🐳 Shipnorth Docker Hosts Setup"
echo "================================"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script needs sudo privileges to modify /etc/hosts"
    echo "💡 Run with: sudo ./scripts/setup-docker-hosts.sh"
    exit 1
fi

# Create backup
echo "📋 Creating backup of hosts file..."
cp "$HOSTS_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Remove existing entries for our domains
echo "🧹 Removing any existing entries for Shipnorth domains..."
for domain in "${DOMAINS[@]}"; do
    # Remove any lines containing our domains (case insensitive)
    sed -i '' "/[[:space:]]${domain}[[:space:]]*$/d" "$HOSTS_FILE"
    sed -i '' "/[[:space:]]${domain}[[:space:]]*#/d" "$HOSTS_FILE"
    echo "   Removed existing entries for: $domain"
done

# Add new entries
echo "➕ Adding new Docker host entries..."
echo "" >> "$HOSTS_FILE"
echo "# Shipnorth Docker Development (added $(date))" >> "$HOSTS_FILE"
echo "127.0.0.1       sn.local.com        # Shipnorth Web Frontend" >> "$HOSTS_FILE"
echo "127.0.0.1       snapi.local.com     # Shipnorth API Backend" >> "$HOSTS_FILE"
echo "" >> "$HOSTS_FILE"

echo "✅ Host entries added successfully!"
echo ""
echo "🌐 Clean URLs now available:"
echo "   • Frontend: http://sn.local.com"
echo "   • API:      http://snapi.local.com"
echo ""
echo "🧪 Testing connectivity..."

# Test the domains
for domain in "${DOMAINS[@]}"; do
    if ping -c 1 "$domain" >/dev/null 2>&1; then
        echo "   ✅ $domain resolves correctly"
    else
        echo "   ❌ $domain failed to resolve"
    fi
done

echo ""
echo "🚀 Setup complete! You can now access:"
echo "   • http://sn.local.com (Web Frontend)"  
echo "   • http://snapi.local.com (API Backend)"
echo ""
echo "📝 To remove these entries later, run:"
echo "   sudo ./scripts/cleanup-docker-hosts.sh"
echo ""
echo "💾 Your original hosts file is backed up at:"
echo "   $BACKUP_FILE"