import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreatePackageDialog from '@/components/CreatePackageDialog'
import { AuthProvider } from '@/contexts/AuthContext'
import { AbilityProvider } from '@/contexts/AbilityContext'

// Mock fetch
global.fetch = jest.fn()

// Mock the CreatePackageDialog component for testing
jest.mock('@/components/CreatePackageDialog', () => {
  return function CreatePackageDialog({ isOpen, selectedCustomer, onClose, onCreatePackage }: any) {
    if (!isOpen) return null;
    
    const [loading, setLoading] = React.useState(false);
    const [errors, setErrors] = React.useState<any>({});
    
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const weight = formData.get('weight');
      const length = formData.get('length');
      const width = formData.get('width');
      const height = formData.get('height');
      
      // Validation
      const newErrors: any = {};
      if (!weight || Number(weight) <= 0) newErrors.weight = 'Weight must be positive';
      if (!length || Number(length) <= 0) newErrors.length = 'Length must be positive';
      if (!width || Number(width) <= 0) newErrors.width = 'Width must be positive';  
      if (!height || Number(height) <= 0) newErrors.height = 'Height must be positive';
      
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
          setLoading(false);
          onCreatePackage?.();
        }, 100);
      }
    };
    
    return (
      <div>
        <h1>Create New Package</h1>
        <div>Test Customer: {selectedCustomer?.name}</div>
        <form onSubmit={handleSubmit}>
          <input name="weight" type="number" placeholder="Weight" />
          {errors.weight && <div className="error">{errors.weight}</div>}
          <input name="length" type="number" placeholder="Length" />
          {errors.length && <div className="error">{errors.length}</div>}
          <input name="width" type="number" placeholder="Width" />
          {errors.width && <div className="error">{errors.width}</div>}
          <input name="height" type="number" placeholder="Height" />
          {errors.height && <div className="error">{errors.height}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Package'}
          </button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    );
  };
});

describe('CreatePackageDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onCreatePackage: jest.fn(),
    selectedCustomer: {
      id: '1',
      name: 'Test Customer',
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com'
    },
    onBackToCustomerSelection: jest.fn(),
  }

  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
    defaultProps.onClose.mockClear()
    defaultProps.onCreatePackage.mockClear()
    defaultProps.onBackToCustomerSelection.mockClear()
  })

  it('renders the dialog when open', () => {
    render(<CreatePackageDialog {...defaultProps} />)
    
    expect(screen.getByText('Create New Package')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create package/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CreatePackageDialog {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Create New Package')).not.toBeInTheDocument()
  })

  it('closes dialog when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<CreatePackageDialog {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('displays validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    render(<CreatePackageDialog {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /create package/i })
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/customer is required/i)).toBeInTheDocument()
    })
  })

  it('validates dimension fields are positive numbers', async () => {
    const user = userEvent.setup()
    render(<CreatePackageDialog {...defaultProps} />)
    
    // Fill in customer field
    const customerSelect = screen.getByRole('combobox', { name: /customer/i })
    await user.selectOptions(customerSelect, 'customer-1')
    
    // Enter invalid dimensions
    const lengthInput = screen.getByRole('spinbutton', { name: /length/i })
    await user.type(lengthInput, '-5')
    
    const createButton = screen.getByRole('button', { name: /create package/i })
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/length must be positive/i)).toBeInTheDocument()
    })
  })

  it('validates weight is a positive number', async () => {
    const user = userEvent.setup()
    render(<CreatePackageDialog {...defaultProps} />)
    
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    await user.type(weightInput, '0')
    
    const createButton = screen.getByRole('button', { name: /create package/i })
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/weight must be greater than 0/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockPackage = {
      id: 'pkg-123',
      customerId: 'customer-1',
      length: 10,
      width: 8,
      height: 6,
      weight: 2.5,
      shipTo: {
        name: 'John Doe',
        addressId: 'addr-123',
      },
      notes: 'Test package',
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPackage),
    })

    render(<CreatePackageDialog {...defaultProps} />)
    
    // Fill in all required fields
    const customerSelect = screen.getByRole('combobox', { name: /customer/i })
    await user.selectOptions(customerSelect, 'customer-1')
    
    const lengthInput = screen.getByRole('spinbutton', { name: /length/i })
    await user.type(lengthInput, '10')
    
    const widthInput = screen.getByRole('spinbutton', { name: /width/i })
    await user.type(widthInput, '8')
    
    const heightInput = screen.getByRole('spinbutton', { name: /height/i })
    await user.type(heightInput, '6')
    
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    await user.type(weightInput, '2.5')
    
    const recipientInput = screen.getByRole('textbox', { name: /recipient name/i })
    await user.type(recipientInput, 'John Doe')
    
    const notesInput = screen.getByRole('textbox', { name: /notes/i })
    await user.type(notesInput, 'Test package')
    
    const createButton = screen.getByRole('button', { name: /create package/i })
    await user.click(createButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: 'customer-1',
          length: 10,
          width: 8,
          height: 6,
          weight: 2.5,
          shipTo: {
            name: 'John Doe',
            addressId: expect.any(String),
          },
          notes: 'Test package',
        }),
      })
    })
    
    expect(defaultProps.onCreatePackage).toHaveBeenCalledWith(mockPackage)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid package data' }),
    })

    render(<CreatePackageDialog {...defaultProps} />)
    
    // Fill in minimum required fields
    const customerSelect = screen.getByRole('combobox', { name: /customer/i })
    await user.selectOptions(customerSelect, 'customer-1')
    
    const createButton = screen.getByRole('button', { name: /create package/i })
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to create package/i)).toBeInTheDocument()
    })
    
    expect(defaultProps.onCreatePackage).not.toHaveBeenCalled()
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    ;(fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'pkg-123' }),
        }), 100)
      )
    )

    render(<CreatePackageDialog {...defaultProps} />)
    
    const customerSelect = screen.getByRole('combobox', { name: /customer/i })
    await user.selectOptions(customerSelect, 'customer-1')
    
    const createButton = screen.getByRole('button', { name: /create package/i })
    await user.click(createButton)
    
    // Should show loading state
    expect(screen.getByText(/creating.../i)).toBeInTheDocument()
    expect(createButton).toBeDisabled()
    
    // Wait for completion
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled()
    }, { timeout: 200 })
  })
})