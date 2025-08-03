# FileToffee - Instant and Collaborative File Sharing Web Application

FileToffee is a web-based application that offers both anonymous instant file sharing and authenticated collaborative file management, catering to individual users and professional teams alike.

## Features

- ✨ **Share files like digital toffees**
- ⚡ **One-click anonymous upload and sharing**
- 🔐 **User registration and secure login (JWT + bcrypt)**
- 📂 **Create and manage workspaces**
- 🔗 **Invite users via code or link**
- 📅 **Add/edit/delete files in workspace folders**
- 🖊️ **Real-time collaboration: comments, co-editing**
- ⚖️ **Role-based actions: rename, delete, upload**
- 📁 **Recycle bin and version control**
- 📱 **Fully responsive UI with mobile-friendly design**

## Technology Stack

- **Frontend**: React.js, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Token), bcrypt
- **File Storage**: Local file system (can be extended to AWS S3 or other cloud storage)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/file-toffee.git
   cd file-toffee
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   cd client
   npm install
   cd ..
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/fileShareApp
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   FILE_UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=100000000
   ```

5. Start the development server:
   ```
   npm run dev-full
   ```

The application will be available at http://localhost:3000

## API Endpoints

### Authentication

- `POST /api/users` - Register a new user
- `POST /api/auth` - Authenticate user and get token
- `GET /api/auth` - Get authenticated user

### Workspaces

- `POST /api/workspaces` - Create a new workspace
- `GET /api/workspaces` - Get all workspaces for user
- `GET /api/workspaces/:id` - Get workspace by ID
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/join/:code` - Join a workspace with access code
- `PUT /api/workspaces/:id/members/:userId` - Update member role in workspace
- `DELETE /api/workspaces/:id/members/:userId` - Remove member from workspace

### Files

- `POST /api/files/anonymous` - Upload anonymous file
- `POST /api/files/workspace/:workspaceId` - Upload file to workspace
- `GET /api/files/workspace/:workspaceId` - Get all files in workspace
- `GET /api/files/share/:shareId` - Get shared file by shareId
- `GET /api/files/:id` - Get file by ID
- `PUT /api/files/:id` - Update file (rename or move)
- `DELETE /api/files/:id` - Delete file (move to recycle bin)
- `PUT /api/files/:id/restore` - Restore file from recycle bin
- `DELETE /api/files/:id/permanent` - Permanently delete file

## License

This project is licensed under the MIT License.

## Author

Nikita Darmora 