# Taxis Flecha

A full-stack web application built with Vite + React frontend and Express.js backend.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Development**: TSX for TypeScript execution

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables (create a `.env` file based on your database configuration)

4. Push the database schema:

   ```bash
   npm run db:push
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at the configured port.

### Building

Build the application for production:

```bash
npm run build
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```fairydust
├── client/          # Frontend React application
├── server/          # Backend Express.js server
├── shared/          # Shared types and utilities
├── script/          # Build scripts
└── dist/           # Production build output
```
