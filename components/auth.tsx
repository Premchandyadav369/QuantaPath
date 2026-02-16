"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Session } from '@supabase/supabase-js'

interface AuthComponentProps {
  session: Session | null
}

export function AuthComponent({ session }: AuthComponentProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (!session) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">Login</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login to QuantaPath</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'github']}
              socialLayout="horizontal"
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        Welcome, {session.user.email}
      </span>
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  )
}
