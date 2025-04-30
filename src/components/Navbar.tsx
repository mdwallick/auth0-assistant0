'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@auth0/nextjs-auth0'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

// ActiveLink component remains the same
export const ActiveLink = (props: { href: string; children: ReactNode }) => {
  const pathname = usePathname()
  return (
    <Link
      href={props.href}
      className={cn(
        'px-4 py-2 rounded-[18px] whitespace-nowrap flex items-center gap-2 text-sm transition-all',
        pathname === props.href && 'bg-primary text-primary-foreground',
      )}
    >
      {props.children}
    </Link>
  )
}

export function Navbar() {
  // Use the useUser hook to get user state, loading status, and errors
  const { user, error, isLoading } = useUser()

  // The useEffect fetching logic is no longer needed

  const clearChat = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatHistory');
      // window.location.reload() // Avoid full reload if possible
      window.location.href = '/'; // Redirect to home or relevant page
    }
  };

  // Handle loading state
  if (isLoading) {
      // Optional: Render a loading state or a simplified Navbar
      return (
        <nav className="flex items-center justify-between p-4 border-b bg-background">
           <div>{/* Placeholder for left content */}</div>
           <div className="flex items-center gap-4">
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div> {/* Placeholder */}
           </div>
        </nav>
      );
  }

  // Handle error state
  if (error) {
      console.error("Error fetching user:", error);
      // Optional: Render an error state or default Navbar for logged-out users
      // For now, we'll proceed as if logged out if there's an error
  }


  // Render the Navbar - user object will be populated only if logged in
  return (
    <nav className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={clearChat}>
          New Chat
        </Button>
        {/* You could add other nav links here */}
      </div>
      <div className="flex items-center gap-4">
        {/* Conditional rendering based on the user object from the hook */}
        {user && (
          <Popover>
            <PopoverTrigger asChild>
              {/* Type assertion needed if user type isn't automatically inferred perfectly */}
              <Button variant="ghost" className="flex items-center gap-2">
                {(user.picture) && (
                  <Image
                    src={user.picture} // Property access is safe now
                    alt={user.name ?? 'Profile'} // Use nullish coalescing for alt text
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                {/* Display name, nickname, or email as fallback */}
                <span>{user.name ?? user.nickname ?? user.email}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="flex flex-col space-y-1">
                <Button variant="ghost" asChild className="justify-start">
                  <Link href="/profile">Profile</Link>
                </Button>
                {/* Standard logout link for the SDK */}
                <Button variant="ghost" asChild className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Link href="/auth/logout">Logout</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {/* Show Login button if user is not logged in and there's no error */}
        {!user && !error && (
            <Button asChild>
                <Link href="/auth/login">Login</Link>
            </Button>
        )}
      </div>
    </nav>
  );
}
