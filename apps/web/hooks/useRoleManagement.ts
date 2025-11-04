'use client'

import { useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from '@/components/ui/toast-hook'

interface UseRoleManagementReturn {
  currentRole: string | null
  isChangingRole: boolean
  changeRole: (newRole: string, tenantId: string) => Promise<boolean>
  refreshSession: () => Promise<void>
}

export function useRoleManagement(): UseRoleManagementReturn {
  const { data: session, update, status } = useSession()
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  // Initialize current role from session
  useState(() => {
    if (session?.user?.role) {
      setCurrentRole(session.user.role)
    }
  })

  const changeRole = useCallback(async (newRole: string, tenantId: string): Promise<boolean> => {
    if (isChangingRole) {
      return false
    }

    if (!session?.user?.id) {
      toast.error('No pudimos identificar al usuario')
      return false
    }

    setIsChangingRole(true)

    try {
      const response = await fetch('/api/profile/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: newRole,
          tenantId,
          userId: session.user.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Update local state
        setCurrentRole(newRole)
        
        // Update session with new role
        await update({
          ...session.user,
          role: newRole,
        })

        toast.success(result.message || 'Rol actualizado correctamente')
        return true
      } else {
        toast.error(result.error || 'Error al actualizar el rol')
        return false
      }
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error('Error al actualizar el rol')
      return false
    } finally {
      setIsChangingRole(false)
    }
  }, [session, isChangingRole, update])

  const refreshSession = useCallback(async () => {
    try {
      // Refresh the session to ensure we have the latest data
      await update()
      
      // Update current role if it changed
      if (session?.user?.role) {
        setCurrentRole(session.user.role)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }, [session, update])

  return {
    currentRole,
    isChangingRole,
    changeRole,
    refreshSession,
  }
}