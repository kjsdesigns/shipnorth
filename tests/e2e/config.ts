export const config = {
  apiUrl: process.env.TEST_ENV === 'dev' 
    ? 'https://rv6q5b27n2.execute-api.ca-central-1.amazonaws.com'
    : 'http://localhost:4000',
  webUrl: process.env.TEST_ENV === 'dev'
    ? 'https://rv6q5b27n2.execute-api.ca-central-1.amazonaws.com' 
    : 'http://localhost:3001',
  testUsers: {
    admin: {
      email: 'admin@shipnorth.com',
      password: 'admin123'
    },
    staff: {
      email: 'staff@shipnorth.com', 
      password: 'staff123'
    },
    customer: {
      email: 'john.doe@example.com',
      password: 'customer123'
    },
    driver: {
      email: 'driver@shipnorth.com',
      password: 'driver123'
    }
  }
};