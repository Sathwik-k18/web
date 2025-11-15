"use client"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function UserMenu({ username }: { username: string }) {
  const router = useRouter()
  const supabase = createClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {username?.charAt(0)?.toUpperCase() || "U"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-40">
        <DropdownMenuItem>{username}</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
