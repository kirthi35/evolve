import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Library, 
  Users, 
  Plus,
  ChevronRight
} from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/admin/dashboard'
    },
    {
      name: 'Content Library',
      href: '/admin/content',
      icon: Library,
      current: location.pathname.startsWith('/admin/content'),
      children: [
        {
          name: 'All Content',
          href: '/admin/content',
          current: location.pathname === '/admin/content'
        },
        {
          name: 'Add New Content',
          href: '/admin/content/new',
          current: location.pathname === '/admin/content/new'
        }
      ]
    },
    {
      name: 'Users Table',
      href: '/admin/users',
      icon: Users,
      current: location.pathname.startsWith('/admin/users')
    }
  ];

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-full">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <div key={item.name}>
            <Link
              to={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                item.current
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
              {item.children && (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </Link>
            
            {/* Nested items */}
            {item.children && item.current && (
              <div className="ml-8 mt-2 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.name}
                    to={child.href}
                    className={cn(
                      'group flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                      child.current
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <span className="ml-2">{child.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
