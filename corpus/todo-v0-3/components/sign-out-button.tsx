'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
      <LogOut className="size-4" aria-hidden="true" />
      Sign out
    </Button>
  )
}
