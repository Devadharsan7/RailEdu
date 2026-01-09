# Login Credentials

## Admin Credentials
- **ID**: `ADM-8821`
- **Password**: `admin123`
- **User Type**: Administrator
- **Access**: Admin Dashboard (`/`) and Excel Import (`/excel-import`)

## User Credentials
- **ID**: `STU-882910`
- **Password**: `user123`
- **User Type**: Crew Member (Student)
- **Access**: Student Dashboard (`/dashboard`)

## How to Login

1. Navigate to `/login` page
2. Select user type (Administrator or Crew Member)
3. Enter the corresponding ID and password
4. Click "Sign In"
5. You will be redirected to the appropriate dashboard based on your user type

## Features

- **Authentication**: Credentials are validated against predefined values
- **Route Protection**: Pages are protected and require authentication
- **Auto Redirect**: Users are redirected to their respective dashboards after login
- **Logout**: Logout button available in both admin and student headers
- **Session Management**: Authentication state is stored in localStorage

## Notes

- Demo credentials are displayed on the login page for easy reference
- Invalid credentials will show an error message
- Unauthenticated users trying to access protected routes will be redirected to login
- Users can only access routes allowed for their user type



