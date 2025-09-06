import { renderHook } from '@testing-library/react'
import { usePermissions } from '@/hooks/usePermissions'
import { AbilityProvider } from '@/contexts/AbilityContext'
import React from 'react'

// Mock the AbilityContext
const mockCan = jest.fn()
const mockAbility = {
  can: mockCan,
  cannot: jest.fn(),
  update: jest.fn(),
}

jest.mock('@/contexts/AbilityContext', () => ({
  useAbility: () => ({
    ability: mockAbility,
    isLoading: false,
    updateAbility: jest.fn(),
  }),
  AbilityProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('usePermissions', () => {
  beforeEach(() => {
    mockCan.mockClear()
  })

  it('returns correct permission check functions', () => {
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canCreatePackage).toBeDefined()
    expect(result.current.canEditPackage).toBeDefined()
    expect(result.current.canDeletePackage).toBeDefined()
    expect(result.current.canViewCustomers).toBeDefined()
    expect(result.current.canManageLoads).toBeDefined()
    expect(result.current.canAccessAdmin).toBeDefined()
    expect(result.current.canViewReports).toBeDefined()
  })

  it('canCreatePackage returns correct permission', () => {
    mockCan.mockReturnValue(true)
    
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canCreatePackage()).toBe(true)
    expect(mockCan).toHaveBeenCalledWith('create', 'Package')
  })

  it('canEditPackage returns correct permission for specific package', () => {
    mockCan.mockReturnValue(true)
    const mockPackage = { id: '1', customerId: 'customer-1' }
    
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canEditPackage()).toBe(true)
    expect(mockCan).toHaveBeenCalledWith('update', 'Package')
  })

  it('canDeletePackage returns correct permission', () => {
    mockCan.mockReturnValue(false)
    const mockPackage = { id: '1', customerId: 'customer-1' }
    
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canDeletePackage()).toBe(false)
    expect(mockCan).toHaveBeenCalledWith('delete', 'Package')
  })

  it('canViewCustomers returns correct permission', () => {
    mockCan.mockReturnValue(true)
    
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canViewCustomers()).toBe(true)
    expect(mockCan).toHaveBeenCalledWith('read', 'Customer')
  })

  it('canManageLoads returns correct permission', () => {
    mockCan.mockReturnValue(false)
    
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canManageLoads()).toBe(false)
    expect(mockCan).toHaveBeenCalledWith('manage', 'Load')
  })

  it('canAccessAdmin returns correct permission', () => {
    mockCan.mockReturnValue(true)
    
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canAccessAdmin()).toBe(true)
    expect(mockCan).toHaveBeenCalledWith('access', 'Admin')
  })

  it('canViewReports returns correct permission', () => {
    mockCan.mockReturnValue(false)
    
    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.canViewReports()).toBe(false)
    expect(mockCan).toHaveBeenCalledWith('read', 'Report')
  })

})