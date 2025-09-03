'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PackageIcon, 
  UsersIcon, 
  TruckIcon,
  FileTextIcon,
  UserCogIcon,
  SettingsIcon,
  BarChart3Icon,
  FolderOpenIcon
} from 'lucide-react';
import { Can } from '@/components/auth/Can';
import { useIsAdmin } from '@/hooks/usePermissions';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {children}
    </Link>
  );
}

function NavSeparator({ label }: { label: string }) {
  return (
    <div className="pt-4 pb-2">
      <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

export default function StaffNavigation() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  return (
    <nav className="space-y-1 px-2">
      {/* Regular staff menu items */}
      <NavItem 
        href="/staff" 
        icon={<HomeIcon className="h-5 w-5" />}
        isActive={pathname === '/staff'}
      >
        Dashboard
      </NavItem>
      
      <Can I="read" a="Package">
        <NavItem 
          href="/staff/packages" 
          icon={<PackageIcon className="h-5 w-5" />}
          isActive={pathname.startsWith('/staff/packages')}
        >
          Packages
        </NavItem>
      </Can>
      
      <Can I="read" a="Customer">
        <NavItem 
          href="/staff/customers" 
          icon={<UsersIcon className="h-5 w-5" />}
          isActive={pathname.startsWith('/staff/customers')}
        >
          Customers
        </NavItem>
      </Can>
      
      <Can I="read" a="Load">
        <NavItem 
          href="/staff/loads" 
          icon={<TruckIcon className="h-5 w-5" />}
          isActive={pathname.startsWith('/staff/loads')}
        >
          Loads
        </NavItem>
      </Can>

      <Can I="read" a="Invoice">
        <NavItem 
          href="/staff/invoices" 
          icon={<FileTextIcon className="h-5 w-5" />}
          isActive={pathname.startsWith('/staff/invoices')}
        >
          Invoices
        </NavItem>
      </Can>

      <Can I="read" a="Report">
        <NavItem 
          href="/staff/reports" 
          icon={<BarChart3Icon className="h-5 w-5" />}
          isActive={pathname.startsWith('/staff/reports')}
        >
          Reports
        </NavItem>
      </Can>
      
      {/* Admin-only menu items (overlay) */}
      {isAdmin && (
        <>
          <NavSeparator label="Administration" />
          
          <Can I="manage" a="User">
            <NavItem 
              href="/staff/admin/users" 
              icon={<UserCogIcon className="h-5 w-5" />}
              isActive={pathname.startsWith('/staff/admin/users')}
            >
              User Management
            </NavItem>
          </Can>
          
          <Can I="manage" a="Settings">
            <NavItem 
              href="/staff/admin/settings" 
              icon={<SettingsIcon className="h-5 w-5" />}
              isActive={pathname.startsWith('/staff/admin/settings')}
            >
              System Settings
            </NavItem>
          </Can>
          
          <Can I="read" a="AuditLog">
            <NavItem 
              href="/staff/admin/audit" 
              icon={<FolderOpenIcon className="h-5 w-5" />}
              isActive={pathname.startsWith('/staff/admin/audit')}
            >
              Audit Logs
            </NavItem>
          </Can>
        </>
      )}
    </nav>
  );
}