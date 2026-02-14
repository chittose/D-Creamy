"use client"

import { useAuth, UserRole } from "@/lib/auth/auth-context"

interface RoleGateProps {
    /** Required role(s) to view content */
    allowedRoles: UserRole | UserRole[]
    /** Content to show if user has access */
    children: React.ReactNode
    /** Content to show if user doesn't have access */
    fallback?: React.ReactNode
}

/**
 * Component to conditionally render content based on user role
 * 
 * @example
 * <RoleGate allowedRoles="owner">
 *   <DeleteButton />
 * </RoleGate>
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
    const { role, isLoading } = useAuth()

    if (isLoading) {
        return null
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    if (!role || !roles.includes(role)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * Hook to check if current user has required role
 */
export function useHasRole(requiredRole: UserRole | UserRole[]): boolean {
    const { role } = useAuth()

    if (!role) return false

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(role)
}

/**
 * Hook to check if user is owner
 */
export function useIsOwner(): boolean {
    return useHasRole("owner")
}

/**
 * Hook to check if user is staff
 */
export function useIsStaff(): boolean {
    return useHasRole("staff")
}
