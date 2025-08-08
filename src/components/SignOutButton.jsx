'use client'
import { createClient } from "../utils/supabase/client" // <-- PERBAIKAN
import { useRouter } from "next/navigation"

export default function SignOutButton() {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <button
            onClick={handleSignOut}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
        >
            Sign Out
        </button>
    )
}