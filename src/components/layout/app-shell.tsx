'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Award,
  Bot,
  CreditCard,
  History,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const teenNavItems = [
  { id: 'home', label: 'Dashboard', href: '/teen', icon: Sparkles },
  { id: 'save', label: 'Save', href: '/teen/save', icon: PiggyBank },
  { id: 'subscribe', label: 'Subscribe', href: '/teen/subscribe', icon: CreditCard },
  { id: 'chat', label: 'Calma', href: '/teen/chat', icon: Bot },
  { id: 'passport', label: 'Passport', href: '/teen/passport', icon: Award },
  { id: 'activity', label: 'Activity', href: '/teen/activity', icon: History },
]

const guardianNavItems = [
  { id: 'home', label: 'Dashboard', href: '/guardian', icon: LayoutDashboard },
  { id: 'inbox', label: 'Approvals', href: '/guardian/inbox', icon: Inbox },
  { id: 'setup', label: 'Policy Setup', href: '/guardian/setup', icon: Shield },
  { id: 'family', label: 'Family', href: '/guardian/family', icon: Users },
  { id: 'activity', label: 'Activity', href: '/guardian/activity', icon: History },
]

interface AppShellProps {
  role: 'teen' | 'guardian'
  children: React.ReactNode
  userName?: string
}

export function AppShell({ role, children, userName = 'User' }: AppShellProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const navItems = role === 'teen' ? teenNavItems : guardianNavItems

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-sidebar-border/30">
        <SidebarHeader className="border-b border-sidebar-border/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <span className="text-lg font-bold text-gold-gradient">C</span>
            </div>
            <div>
              <p className="font-semibold text-sidebar-foreground">Calma</p>
              <p className="text-xs capitalize text-muted-foreground">{role} View</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== `/${role}` && pathname.startsWith(item.href))
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-4 w-4",
                            isActive && "text-primary"
                          )} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="border-t border-sidebar-border/30 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
              <p className="text-xs capitalize text-muted-foreground">{role}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b border-border/30 bg-background/50 backdrop-blur-sm px-4 lg:px-6">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-6 bg-border/50" />
          <div className="flex-1">
            <h1 className="text-sm font-medium text-foreground">
              {navItems.find(item =>
                pathname === item.href ||
                (item.href !== `/${role}` && pathname.startsWith(item.href))
              )?.label || 'Dashboard'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav items={navItems.slice(0, 5)} currentPath={pathname} />}
      </SidebarInset>
    </SidebarProvider>
  )
}

function MobileBottomNav({
  items,
  currentPath
}: {
  items: typeof teenNavItems
  currentPath: string
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== '/teen' && item.href !== '/guardian' && currentPath.startsWith(item.href))
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive && "text-primary"
              )} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
