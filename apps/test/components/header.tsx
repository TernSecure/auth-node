'use client';

import { useAuth } from '@ternauth-node/nextjs';
import { clearNextSessionCookie } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Moon, Settings, User } from 'lucide-react';
import { authHandlerOptions } from '@/lib/auth';

export function Header() {
  const { signOut } = useAuth();

  const createSignOut = () => {
    signOut({
      async onBeforeSignOut() {
        await clearNextSessionCookie({
          cookies: authHandlerOptions.cookies,
          revokeRefreshTokensOnSignOut: authHandlerOptions.revokeRefreshTokensOnSignOut,
        });
      },
    });
  };

  return (
    <header className='border-b'>
      <div className='container mx-auto flex items-center justify-between px-4 py-4'>
        <div className='flex items-center gap-2'>
          <h1 className='text-xl font-semibold'>TernSecure</h1>
        </div>

        <nav className='flex items-center gap-4'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='rounded-full'
              >
                <User className='h-5 w-5' />
                <span className='sr-only'>User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-56'
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className='mr-2 h-4 w-4' />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Moon className='mr-2 h-4 w-4' />
                <span>Theme</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={createSignOut}
                className='text-destructive'
              >
                <LogOut className='mr-2 h-4 w-4' />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
