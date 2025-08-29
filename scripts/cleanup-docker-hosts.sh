#!/bin/bash

# Shipnorth Docker Hosts Cleanup
# Removes Shipnorth domain entries from hosts file

HOSTS_FILE="/etc/hosts"
DOMAINS=("sn.local.com" "snapi.local.com")
BACKUP_FILE="/etc/hosts.backup.$(date +%Y%m%d_%H%M%S)"

echo "🧹 Shipnorth Docker Hosts Cleanup"
echo "=================================="

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script needs sudo privileges to modify /etc/hosts"
    echo "💡 Run with: sudo ./scripts/cleanup-docker-hosts.sh"
    exit 1
fi

# Create backup
echo "📋 Creating backup of hosts file..."
cp "$HOSTS_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Remove Shipnorth entries
echo "🗑️  Removing Shipnorth Docker host entries..."
for domain in "${DOMAINS[@]}"; do
    sed -i '' "/[[:space:]]${domain}[[:space:]]*$/d" "$HOSTS_FILE"
    sed -i '' "/[[:space:]]${domain}[[:space:]]*#/d" "$HOSTS_FILE"
    echo "   Removed entries for: $domain"
done

# Remove Shipnorth comment lines
sed -i '' "/# Shipnorth Docker Development/d" "$HOSTS_FILE"

echo "✅ Cleanup complete!"
echo "💾 Your hosts file is backed up at:"
echo "   $BACKUP_FILE"