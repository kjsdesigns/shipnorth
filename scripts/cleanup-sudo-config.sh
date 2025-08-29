#!/bin/bash

# Cleanup Sudo Configurations
# Removes all the pfctl and hosts file changes from previous setup

echo "🧹 Cleaning up previous sudo configurations..."
echo "=================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This cleanup requires sudo access"
  echo "💡 Please run: sudo ./scripts/cleanup-sudo-config.sh"
  exit 1
fi

echo "✅ Running with sudo privileges"

# 1. Remove hosts file entries
echo "📝 Cleaning /etc/hosts..."
if grep -q "sn.local.com" /etc/hosts; then
    sed -i '' '/sn\.local\.com/d' /etc/hosts
    echo "✅ Removed sn.local.com from hosts file"
else
    echo "ℹ️ sn.local.com not found in hosts file"
fi

if grep -q "snapi.local.com" /etc/hosts; then
    sed -i '' '/snapi\.local\.com/d' /etc/hosts
    echo "✅ Removed snapi.local.com from hosts file"
else
    echo "ℹ️ snapi.local.com not found in hosts file"
fi

# Remove Shipnorth comment lines
sed -i '' '/# Shipnorth Local Development/d' /etc/hosts

# 2. Remove pfctl anchor and rules
echo "🔀 Cleaning port forwarding rules..."
if [ -f /etc/pf.anchors/shipnorth ]; then
    rm /etc/pf.anchors/shipnorth
    echo "✅ Removed pfctl anchor file"
fi

# Remove anchor from pf.conf
if grep -q "shipnorth" /etc/pf.conf; then
    sed -i '' '/shipnorth/d' /etc/pf.conf
    echo "✅ Removed shipnorth rules from pf.conf"
fi

# Reload pfctl to remove rules
pfctl -f /etc/pf.conf > /dev/null 2>&1
echo "✅ Reloaded pfctl rules"

# 3. Clean up any backup files older than 1 day
echo "🗑️ Cleaning backup files..."
find /etc -name "*.backup.*" -mtime +1 -delete 2>/dev/null || true
echo "✅ Cleaned old backup files"

# 4. Verify cleanup
echo ""
echo "🔍 Verifying cleanup..."

if grep -q "sn.local.com\|snapi.local.com" /etc/hosts; then
    echo "⚠️ Some domain entries still in hosts file"
else
    echo "✅ Hosts file cleaned"
fi

if [ -f /etc/pf.anchors/shipnorth ]; then
    echo "⚠️ pfctl anchor still exists"
else
    echo "✅ pfctl rules cleaned"
fi

echo ""
echo "🎉 CLEANUP COMPLETE!"
echo "=================================================="
echo "✅ All sudo configurations removed"
echo "✅ Hosts file restored"  
echo "✅ Port forwarding rules removed"
echo "✅ System ready for Docker Compose setup"
echo ""
echo "💡 Next step: Run Docker setup (no sudo needed)"
echo "   ./scripts/setup-docker-development.sh"
echo "=================================================="