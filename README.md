# FileToffee - Secure File Sharing Platform 🚀
  This project aims to build a secure and user-friendly web-based file sharing platform - FileToffee -enabling both anonymous quick file sharing and authenticated collaborative workspace management. The system allows users to upload, share, and manage files through intuitive features and role-based permissions. Built using the MERN stack (MongoDB, Express, React, Node.js), it leverages modern technologies like JWT authentication, bcrypt encryption, and RESTful APIs to ensure security and performance. 

OBJECTIVE: 
The primary goal of this project is to design and implement a full-stack file sharing application that: 
   Enables anonymous instant file uploads with shareable links. 
   Supports secure user registration and login using JWT and hashed passwords. 
   Provides workspace management for collaboration and file versioning. 
   Allows role-based access control for operations like upload, delete, and rename. 
   Ensures real-time responsiveness across devices. 

SCOPE:  
The project offers a dual-mode experience: 
   Quick Share: Upload files anonymously without account creation. Generates temporary links with 24-hour expiry. 
   Collaborative Workspaces: Registered users can create/join shared workspaces, organize files, and collaborate via comments and file versioning. 

Use Cases: 
   Team collaboration 
   Personal file management 
   One-time file transfers 
   Secure document sharing within organizations  
 
METHODOLOGY: 
1. User Registration & Authentication 
    JWT-based user registration and login. 
   Passwords are encrypted using bcrypt. 
   Tokens manage session state securely. 
2. Anonymous File Sharing 
   Users drag and drop files onto the UI. 
   Files are uploaded and assigned unique shareId links. 
   Links are valid for 24 hours with auto-expiry implemented. 
3. Workspace Creation & Collaboration 
   Users can create and manage workspaces. 
   Files can be added to specific folders. 
   Access can be given through invitation codes or links. 
   Members are assigned roles (Viewer, Editor, Owner). 
4. File Operations 
   Upload, rename, move, delete, and restore files. 
   Deleted files move to a recycle bin with restore options. 
   Version control maintains history of edits or uploads. 
5. Real-Time UI 
   Responsive frontend developed in React.js. 
   Role-based dashboards and file visibility. 
   User feedback via status toasts, modals, and theme switching. 
 
SOFTWARE REQUIREMENTS: 
  Project Name: Instant and Collaborative File Sharing Web Application 
  Language Used: JavaScript (Node.js for backend, React.js for frontend) 
  Type: Full-Stack File Management and Sharing Platform 

TECHNOLOGIES USED: 
• Frontend: 
  o React.js – A powerful JavaScript library for building user interfaces with component-based architecture. 
  o React Router – Manages navigation and routing between application views. 
  o Axios – Handles HTTP requests between the client and backend API. 
  o CSS – Ensures responsive and user-friendly visual design across devices. 
  
• Backend: 
  o Node.js – A JavaScript runtime environment used to build fast and scalable server-side applications. 
  o Express.js – A minimalist web framework for creating robust APIs and handling middleware. 
  
• Database: 
  o MongoDB – A flexible NoSQL database used for storing user, file, and workspace data in JSON-like format. 
  o Authentication & Security: 
  o JWT (JSON Web Token) – Provides stateless authentication through token-based login sessions. 
  o bcrypt – Encrypts user passwords before storing them securely in the database. 
  
• File Storage: 
  o Local File System – Files are stored locally on the server during development. 
  o AWS S3 / Firebase (Optional) – Can be integrated for scalable cloud based file storage in production. 
  
• Utilities & Supporting Libraries: 
  o Multer – Middleware for handling multipart/form-data used in file uploads. 
  o UUID – Generates unique IDs for each uploaded or shared file. 
  o dotenv – Loads environment variables from .env file into process.env. 
  o express-validator – Adds input validation and sanitization to backend routes. 
  o concurrently – Allows simultaneous running of backend and frontend during development. 
  o nodemon – Automatically restarts the server when file changes are detected. 
  
IMPLEMENTATION DETAILS: 
   Backend APIs: Built with Express and structured into RESTful endpoints (/api/users, /api/files, /api/workspaces). 
   Frontend React App: Modular components for login, dashboard, quick share, workspace, and theme control. 
   File Management: multer handles file upload. Metadata stored in MongoDB. 
   Error Handling: Robust backend responses, validation via express validator. 
   Security: Cross-Origin Resource Sharing (cors) and secure headers used.
  
EXPECTED OUTCOME: 
• A fully functional file sharing web application that supports: 
• Quick, anonymous file upload 
• Secure user authentication 
• Collaborative workspace management 
• File access control and versioning 
• A clean, intuitive user interface that adapts to all devices. 
• Deployment-ready codebase for production environments (Render/Vercel). 
