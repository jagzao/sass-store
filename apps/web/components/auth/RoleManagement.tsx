'use client'

import { useState, useEffect } from 'react'
import { useRoleManagement } from '@/hooks/useRoleManagement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast-hook'

interface RoleOption {
  id: string
  name: string
  description: string
  permissions: string[]
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'Admin',
    name: 'Administrador',
    description: 'Acceso completo al sistema y gestión de usuarios',
    permissions: [
      'Gestionar productos y servicios',
      'Administrar usuarios y roles',
      'Ver reportes financieros',
      'Configurar el sistema'
    ]
  },
  {
    id: 'Gerente',
    name: 'Gerente',
    description: 'Gestión de operaciones y reportes',
    permissions: [
      'Gestionar productos y servicios',
      'Ver reportes',
      'Administrar personal'
    ]
  },
  {
    id: 'Personal',
    name: 'Personal',
    description: 'Acceso limitado a funciones operativas',
    permissions: [
      'Actualizar inventario',
      'Gestionar pedidos',
      'Atender clientes'
    ]
  },
  {
    id: 'Cliente',
    name: 'Cliente',
    description: 'Acceso básico para compras y reservas',
    permissions: [
      'Realizar compras',
      'Hacer reservas',
      'Ver historial'
    ]
  }
]

interface RoleManagementProps {
  tenantId: string
  userId: string
  currentRole: string
  onRoleChange?: (newRole: string) => void
}

export function RoleManagement({ 
  tenantId, 
  userId, 
  currentRole,
  onRoleChange 
}: RoleManagementProps) {
  const { changeRole, isChangingRole, refreshSession } = useRoleManagement()
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)

  // Update selected role when currentRole changes
  useEffect(() => {
    setSelectedRole(currentRole)
  }, [currentRole])

  const handleRoleChange = async (newRole: string) => {
    if (!newRole || newRole === currentRole) {
      return
    }

    setSelectedRole(newRole)
    
    const success = await changeRole(newRole, tenantId)
    
    if (success) {
      // Notify parent component
      onRoleChange?.(newRole)
      
      // Refresh session to ensure consistency
      await refreshSession()
    } else {
      // Revert selection on failure
      setSelectedRole(currentRole)
    }
  }

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'Admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'Gerente': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Personal': return 'bg-green-100 text-green-800 border-green-200'
      case 'Cliente': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Roles</CardTitle>
          <CardDescription>Selecciona tu rol en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestión de Roles</span>
          <Badge variant="secondary" className={getRoleColor(currentRole)}>
            {ROLE_OPTIONS.find(r => r.id === currentRole)?.name || currentRole}
          </Badge>
        </CardTitle>
        <CardDescription>
          Selecciona tu rol para personalizar tu experiencia en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Cambiar Rol
            </label>
            <Select
              value={selectedRole}
              onValueChange={handleRoleChange}
              disabled={isChangingRole}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <span>{role.name}</span>
                      {role.id === currentRole && (
                        <Badge variant="secondary" className="text-xs">
                          Actual
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isChangingRole && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              Actualizando rol...
            </div>
          )}

          {selectedRole && selectedRole !== currentRole && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                Confirmación de Cambio
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                ¿Estás seguro que deseas cambiar tu rol a "
                {ROLE_OPTIONS.find(r => r.id === selectedRole)?.name}"?
                Este cambio puede afectar tus permisos en el sistema.
              </p>
              <Button
                size="sm"
                onClick={() => handleRoleChange(selectedRole)}
                disabled={isChangingRole}
              >
                {isChangingRole ? 'Actualizando...' : 'Confirmar Cambio'}
              </Button>
            </div>
          )}
        </div>

        {selectedRole && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Permisos del Rol: {ROLE_OPTIONS.find(r => r.id === selectedRole)?.name}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {ROLE_OPTIONS.find(r => r.id === selectedRole)?.description}
            </p>
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Permisos Incluidos
              </h5>
              <ul className="space-y-1">
                {ROLE_OPTIONS.find(r => r.id === selectedRole)?.permissions.map((permission, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}