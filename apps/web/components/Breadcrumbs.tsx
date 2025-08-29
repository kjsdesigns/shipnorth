'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Define route labels
const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/login': 'Login',
  '/register': 'Register',
  '/staff': 'Staff Dashboard',
  '/portal': 'Customer Portal',
  '/admin': 'Admin Dashboard',
  '/driver': 'Driver Portal',
  '/search': 'Search',
  '/docs': 'Documentation',
};

// Generate breadcrumbs from current path
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/', icon: Home }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);

    // Don't add href for the current page (last item)
    const isLast = currentPath === pathname;
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return breadcrumbs;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Use provided items or generate from path
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  // Don't show breadcrumbs on root page or if only one item
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  const handleClick = (href: string) => {
    router.push(href);
  };

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 mx-2" />
              )}
              <div className="flex items-center space-x-2">
                {Icon && (
                  <Icon
                    className={`h-4 w-4 ${
                      isLast
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                )}
                {item.href ? (
                  <button
                    onClick={() => handleClick(item.href!)}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Specialized breadcrumb components for common patterns
interface PageBreadcrumbsProps {
  pageName: string;
  parentPage?: { name: string; href: string };
  className?: string;
}

export function PageBreadcrumbs({ pageName, parentPage, className }: PageBreadcrumbsProps) {
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/', icon: Home }];

  if (parentPage) {
    items.push({ label: parentPage.name, href: parentPage.href });
  }

  items.push({ label: pageName });

  return <Breadcrumbs items={items} className={className} />;
}

// Context-aware breadcrumbs for different sections
interface SectionBreadcrumbsProps {
  section: 'staff' | 'customer' | 'driver' | 'admin';
  subsection?: string;
  className?: string;
}

export function SectionBreadcrumbs({ section, subsection, className }: SectionBreadcrumbsProps) {
  const sectionConfig = {
    staff: { label: 'Staff Dashboard', href: '/staff' },
    customer: { label: 'Customer Portal', href: '/portal' },
    driver: { label: 'Driver Portal', href: '/driver' },
    admin: { label: 'Admin Dashboard', href: '/admin' },
  };

  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: sectionConfig[section].label, href: sectionConfig[section].href },
  ];

  if (subsection) {
    items.push({ label: subsection });
  }

  return <Breadcrumbs items={items} className={className} />;
}

// Entity-specific breadcrumbs (e.g., for viewing package details)
interface EntityBreadcrumbsProps {
  section: 'staff' | 'customer' | 'driver' | 'admin';
  entityType: string;
  entityId: string;
  entityLabel?: string;
  className?: string;
}

export function EntityBreadcrumbs({
  section,
  entityType,
  entityId,
  entityLabel,
  className,
}: EntityBreadcrumbsProps) {
  const sectionConfig = {
    staff: { label: 'Staff Dashboard', href: '/staff' },
    customer: { label: 'Customer Portal', href: '/portal' },
    driver: { label: 'Driver Portal', href: '/driver' },
    admin: { label: 'Admin Dashboard', href: '/admin' },
  };

  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: sectionConfig[section].label, href: sectionConfig[section].href },
    {
      label: entityType.charAt(0).toUpperCase() + entityType.slice(1) + 's',
      href: `${sectionConfig[section].href}?tab=${entityType}s`,
    },
    {
      label: entityLabel || `${entityType.toUpperCase()} #${entityId.slice(-6)}`,
    },
  ];

  return <Breadcrumbs items={items} className={className} />;
}
