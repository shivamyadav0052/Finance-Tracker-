'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TrendingUp, LayoutDashboard, Receipt, Target, BarChart2, Brain, Shield, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/expenses',   label: 'Expenses',     icon: Receipt },
  { href: '/budget',     label: 'Budget',       icon: Target },
  { href: '/reports',    label: 'Reports',      icon: BarChart2 },
  { href: '/suggestions',label: 'AI Suggestions', icon: Brain },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ft_dark') === 'true';
    setDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('ft_token')) router.push('/auth/login');
  }, [router]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('ft_dark', next);
    document.documentElement.classList.toggle('dark', next);
  };

  const handleLogout = () => { logout(); toast.success('Logged out'); };

  const nav = (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${active
                ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'group-hover:text-green-500'}`} />
            {label}
          </Link>
        );
      })}
      {user?.role === 'admin' && (
        <Link href="/admin" onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${pathname === '/admin'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          <Shield className="w-4 h-4 flex-shrink-0" />
          Admin Panel
        </Link>
      )}
    </nav>
  );

  const sidebar = (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-white leading-none">Finance Tracker+</p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.name || 'Loading...'}</p>
          </div>
        </div>
      </div>

      {nav}

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
        <button onClick={toggleDark}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0f] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-white dark:bg-[#11111b] border-r border-gray-100 dark:border-gray-800">
        {sidebar}
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col w-56 bg-white dark:bg-[#11111b] h-full shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#11111b] border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">Finance Tracker+</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
