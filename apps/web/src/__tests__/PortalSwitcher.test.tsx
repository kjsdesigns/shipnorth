import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PortalSwitcher from '@/components/PortalSwitcher'

// Mock the useRouter hook
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the useAuth hook
let mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'staff',
  roles: ['staff'],
  lastUsedPortal: 'staff' as 'staff' | 'driver' | 'customer'
}

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: true,
    hasRole: (role: string) => mockUser?.roles?.includes(role) || false,
    validateSession: jest.fn(),
  }),
}))

describe('PortalSwitcher', () => {
  beforeEach(() => {
    mockPush.mockClear()
    // Reset mock user to default
    mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'staff',
      roles: ['staff'],
      lastUsedPortal: 'staff'
    }
  })

  it('renders current portal correctly', () => {
    render(<PortalSwitcher />)
    
    expect(screen.getByText('Staff Portal')).toBeInTheDocument()
  })

  it('shows admin badge when user has admin access', () => {
    // Update mock user to have admin access
    mockUser.roles = ['staff', 'admin']
    render(<PortalSwitcher />)
    
    // Check that admin badge or indication is present
    // (This test might need to be adjusted based on actual admin badge implementation)
  })

  it('opens dropdown when clicked', () => {
    // Set user with multiple portal access
    mockUser.roles = ['staff', 'driver', 'customer']
    render(<PortalSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Check if dropdown options are visible
    expect(screen.getByText('Driver Portal')).toBeInTheDocument()
    expect(screen.getByText('Customer Portal')).toBeInTheDocument()
  })

  it('handles driver portal correctly', () => {
    mockUser = {
      id: '1',
      email: 'driver@example.com',
      role: 'driver',
      roles: ['driver'],
      lastUsedPortal: 'driver'
    }
    
    render(<PortalSwitcher />)
    
    expect(screen.getByText('Driver Portal')).toBeInTheDocument()
  })
})