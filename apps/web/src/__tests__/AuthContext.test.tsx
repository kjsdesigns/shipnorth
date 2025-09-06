import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Mock fetch
global.fetch = jest.fn()

// Test component to use the AuthContext
const TestComponent = () => {
  const { user, loading, login, logout } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {user ? (
        <div>
          <span>Welcome {user.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login('test@example.com', 'password')}>
          Login
        </button>
      )}
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  it('starts with loading state', () => {
    // Mock the initial session check
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows login button when not authenticated', async () => {
    // Mock session check returning 401 (not authenticated)
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Not authenticated' }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument()
    })
  })

  it('shows user info when authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'staff',
      roles: ['staff'],
      firstName: 'Test',
      lastName: 'User'
    }

    // Mock successful session check
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        authenticated: true,
        user: mockUser 
      }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Welcome test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })
  })

  it('handles login correctly', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'staff',
      roles: ['staff'],
      firstName: 'Test',
      lastName: 'User'
    }

    // Mock initial state (not authenticated)
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      })
      // Mock successful login
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          user: mockUser,
          token: 'mock-token',
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh'
        }),
      })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument()
    })

    // Click login button (this should trigger the login function)
    const loginButton = screen.getByText('Login')
    loginButton.click()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8850/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
        }),
      })
    })
  })

  it('handles logout correctly', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'staff',
      roles: ['staff'],
    }

    // Mock authenticated user
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })
      // Mock logout
      .mockResolvedValueOnce({
        ok: true,
      })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Welcome test@example.com')).toBeInTheDocument()
    })

    // Click logout
    const logoutButton = screen.getByText('Logout')
    logoutButton.click()

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument()
    })

    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument()
    })
  })
})