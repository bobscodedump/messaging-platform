# Shared Types Package

This package contains TypeScript types and interfaces that are shared across all applications in the monorepo.

## Structure

```
packages/shared-types/
├── src/
│   ├── user.ts          # User-related types
│   ├── message.ts       # Message and template types
│   ├── api.ts           # API response and error types
│   ├── company.ts       # Company, group, and contact types
│   └── index.ts         # Exports all types
├── index.ts             # Main entry point
├── package.json         # Package configuration
└── tsconfig.json        # TypeScript configuration
```

## Usage

### 1. Install the package in your app

Add the dependency to your app's `package.json`:

```json
{
  "dependencies": {
    "shared-types": "workspace:*"
  }
}
```

### 2. Import types in your code

```typescript
// Import specific types
import { User, CreateUserDto, ApiResponse } from 'shared-types';

// Import all types
import * as Types from 'shared-types';
```

### 3. Example usage in backend (Express.js)

```typescript
import { Request, Response } from 'express';
import { User, CreateUserDto, ApiResponse } from 'shared-types';

export async function createUser(req: Request<{}, ApiResponse<User>, CreateUserDto>, res: Response<ApiResponse<User>>) {
  const { email, name, password } = req.body;

  // Your user creation logic here
  const newUser: User = {
    id: 'generated-id',
    email,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  res.json({
    success: true,
    data: newUser,
    message: 'User created successfully',
  });
}
```

### 4. Example usage in frontend (React)

```typescript
import React, { useState } from 'react';
import { User, CreateUserDto, ApiResponse } from 'shared-types';

export function UserForm() {
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    name: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result: ApiResponse<User> = await response.json();

    if (result.success) {
      console.log('User created:', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form JSX here */}
    </form>
  );
}
```

## Available Types

### User Types

- `User` - Complete user object
- `CreateUserDto` - Data for creating a user
- `UpdateUserDto` - Data for updating a user
- `AuthUser` - Authenticated user with roles
- `LoginCredentials` - Login form data
- `AuthToken` - Authentication token response

### Message Types

- `Message` - Complete message object
- `CreateMessageDto` - Data for creating a message
- `MessageTemplate` - Message template object
- `MessageType` - Enum for message types (text, image, file, voice)
- `MessageStatus` - Enum for message status (pending, sent, delivered, read, failed)

### API Types

- `ApiResponse<T>` - Standard API response wrapper
- `PaginatedResponse<T>` - Paginated data response
- `PaginationQuery` - Query parameters for pagination
- `ApiError` - Error response format
- `ValidationError` - Field validation error

### Company Types

- `Company` - Company object
- `Group` - Group object
- `Contact` - Contact object

## Adding New Types

1. Create a new file in `src/` for your types (e.g., `src/newFeature.ts`)
2. Define your types/interfaces in that file
3. Export them from `src/index.ts`:
   ```typescript
   export * from './newFeature';
   ```
4. Run `pnpm install` in the root to update dependencies
5. Import and use in your applications

## Type Checking

To check types in this package:

```bash
cd packages/shared-types
pnpm type-check
```
