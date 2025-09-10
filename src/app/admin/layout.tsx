
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
    SidebarTrigger,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, LogOut, Settings, Truck, ListCollapse, Gavel, MessageSquare, LineChart, Info, UserCircle, Moon, Sun, Languages } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BatsiraiAssistant } from "@/components/batsirai-assistant";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions/logout";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";


export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
              <div className="w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <h1 className="text-2xl font-bold text-center text-foreground">Beyond Borders Logistics</h1>
                </div>
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>Admin Login</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LoginForm />
                  </CardContent>
                  <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground pt-4">
                    <Separator className="mb-4" />
                    <p>To get access, please contact an administrator.</p>
                  </CardFooter>
                </Card>
              </div>
            </main>
        );
    }
    
    const permissions = currentUser?.permissions || [];
    
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="p-4 flex justify-center items-center">
                    <Link href="/admin">
                        <Logo />
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                         {permissions.includes('dashboard') && (
                            <SidebarMenuItem>
                                <SidebarMenuSub>
                                    <SidebarMenuSubButton>
                                        <LayoutDashboard />
                                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                                    </SidebarMenuSubButton>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild>
                                                <Link href="/admin">
                                                    <LineChart />
                                                    <span className="group-data-[collapsible=icon]:hidden">Insights</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                         {permissions.includes('tracking') && (
                                            <SidebarMenuItem>
                                                <SidebarMenuButton asChild>
                                                    <Link href="/admin/tracking">
                                                        <Truck />
                                                         <span className="group-data-[collapsible=icon]:hidden">Tracking</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                         )}
                                         {permissions.includes('packing-list') && (
                                            <SidebarMenuItem>
                                                <SidebarMenuButton asChild>
                                                    <Link href="/admin/packing-list">
                                                        <ListCollapse />
                                                        <span className="group-data-[collapsible=icon]:hidden">Packing List</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                         )}
                                         {permissions.includes('auction-listing') && (
                                            <SidebarMenuItem>
                                                <SidebarMenuButton asChild>
                                                    <Link href="/admin/auction-listing">
                                                        <Gavel />
                                                        <span className="group-data-[collapsible=icon]:hidden">Auction Listing</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                         )}
                                         {permissions.includes('chat') && (
                                            <SidebarMenuItem>
                                                <SidebarMenuButton asChild>
                                                    <Link href="/admin/chat">
                                                        <MessageSquare />
                                                        <span className="group-data-[collapsible=icon]:hidden">Chat</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                         )}
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </SidebarMenuItem>
                         )}
                         {permissions.includes('settings') && (
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/admin/settings">
                                        <Settings />
                                        <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         )}
                         <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/admin/about">
                                    <Info />
                                    <span className="group-data-[collapsible=icon]:hidden">About this App</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    {currentUser ? (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" className="w-full justify-start items-center gap-3 h-auto p-2">
                                    <Avatar>
                                        <AvatarImage src={currentUser.avatarUrl} data-ai-hint="male avatar" />
                                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-300 ease-in-out">
                                        <p className="font-semibold text-sm">{currentUser.name}</p>
                                        <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--sidebar-width)] mb-2 ml-2" side="top" align="start">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                 <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/profile">
                                            <UserCircle className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <ThemeToggle />
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <Languages className="mr-2 h-4 w-4" />
                                            <span>Language</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem>English</DropdownMenuItem>
                                                <DropdownMenuItem>Chinese (Simplified)</DropdownMenuItem>
                                                <DropdownMenuItem>Chinese (Traditional)</DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                    <DropdownMenuItem asChild>
                                        <form action={logout} className="w-full">
                                            <button type="submit" className="w-full flex items-center">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Log out</span>
                                            </button>
                                        </form>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                         <div className="flex items-center gap-3">
                             <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">User not found.</p>
                             <Button variant="outline" size="sm" asChild>
                                 <Link href="/admin">Login</Link>
                             </Button>
                         </div>
                    )}
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex items-center justify-between p-4 border-b">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
                    <div className="hidden md:flex items-center gap-2">
                        {permissions.includes('auction-listing') && (
                            <Button variant="outline" asChild>
                                <Link href="/auction" target="_blank">
                                    <Gavel className="mr-2 h-4 w-4" />
                                    View Auction
                                </Link>
                            </Button>
                        )}
                        {permissions.includes('settings') && (
                             <Button variant="outline" asChild>
                                <Link href="/admin/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </Button>
                        )}
                    </div>
                </header>
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
                <BatsiraiAssistant />
            </SidebarInset>
        </SidebarProvider>
    );
  }

    
