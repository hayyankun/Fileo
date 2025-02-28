# Fileo - A Minimalist File Sharing App

Fileo is a clean, minimalist file sharing web application designed with a focus on user experience. The app features a premium black-and-white aesthetic with rounded corners, smooth UI animations, and a mobile-first approach.

## Features

- **User Authentication**: Secure login/signup with email/password and social login options (Google, GitHub)
- **File Management**: Upload, download, rename, and delete files
- **File Sharing**: Share files with optional password protection and expiry dates
- **Responsive Design**: Mobile-first approach ensures usability on all devices
- **Dark/Light Mode**: Toggle between dark and light themes based on user preference
- **Drag-and-Drop**: Intuitive file uploading with drag-and-drop functionality
- **Progress Indicators**: Visual feedback during file uploads
- **Search and Filter**: Easily find files through search and filtering options

## Tech Stack

- **Frontend**: React, React Router, Framer Motion, Tailwind CSS
- **Backend**: Supabase (Authentication, Storage, and Database)
- **Language**: JavaScript/JSX
- **Build Tool**: Vite

## Setup Instructions

### Prerequisites

- Node.js (16.x or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/fileo.git
   cd fileo
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Supabase Setup

1. Create a new Supabase project
2. Set up the following tables in your Supabase database:

   **profiles**
   ```sql
   create table profiles (
     id uuid references auth.users on delete cascade,
     full_name text,
     avatar_url text,
     updated_at timestamp with time zone,
     primary key (id)
   );

   -- Set up Row Level Security (RLS)
   alter table profiles enable row level security;

   create policy "Public profiles are viewable by everyone."
     on profiles for select
     using ( true );

   create policy "Users can insert their own profile."
     on profiles for insert
     with check ( auth.uid() = id );

   create policy "Users can update own profile."
     on profiles for update
     using ( auth.uid() = id );
   ```

   **files**
   ```sql
   create table files (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users on delete cascade not null,
     filename text not null,
     file_path text not null,
     file_url text,
     size bigint,
     created_at timestamp with time zone default now() not null
   );

   -- Set up Row Level Security
   alter table files enable row level security;

   create policy "Files are viewable by owner only."
     on files for select
     using ( auth.uid() = user_id );

   create policy "Files can be inserted by owner only."
     on files for insert
     with check ( auth.uid() = user_id );

   create policy "Files can be updated by owner only."
     on files for update
     using ( auth.uid() = user_id );

   create policy "Files can be deleted by owner only."
     on files for delete
     using ( auth.uid() = user_id );
   ```

   **shares**
   ```sql
   create table shares (
     id uuid default uuid_generate_v4() primary key,
     file_id uuid references files on delete cascade not null,
     link text not null,
     password text,
     expiry timestamp with time zone,
     created_at timestamp with time zone default now() not null
   );

   -- Set up Row Level Security
   alter table shares enable row level security;

   -- Owner can perform any operation
   create policy "Shares can be managed by file owner."
     on shares for all
     using ( auth.uid() = (select user_id from files where id = file_id) );

   -- Public share access for viewing
   create policy "Public shares are viewable by everyone with link."
     on shares for select
     using ( true );
   ```

3. Set up Storage Buckets:
   - Create a bucket named `fileo-files`
   - Set up appropriate bucket permissions for authenticated users

## Project Structure

```
fileo/
├── public/             # Static files
├── src/                # Source files
│   ├── components/     # React components
│   │   ├── auth/       # Authentication components
│   │   ├── file/       # File-related components
│   │   ├── layout/     # Layout components
│   │   └── ui/         # UI components
│   ├── contexts/       # React contexts
│   ├── pages/          # Page components
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main App component
│   ├── index.css       # Global styles
│   └── main.jsx        # Entry point
├── .gitignore          # Git ignore file
├── index.html          # HTML template
├── package.json        # Dependencies
├── README.md           # Project documentation
├── tailwind.config.js  # Tailwind CSS configuration
└── vite.config.js      # Vite configuration
```

## License

MIT

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/fileo](https://github.com/yourusername/fileo)
