# Software Requirements Document (SRD)

## Project Title: Instant and Collaborative File Sharing Web Application

### Prepared by: Nikita Darmora


---

## 1. Introduction

In the digital era, efficient and secure file sharing is vital for productivity and collaboration. This web-based application is designed to offer both **anonymous instant file sharing** and **authenticated collaborative file management**, catering to individual users and professional teams alike. It focuses on eliminating friction in quick file transfers and providing a structured platform for team-based collaboration. The platform allows users to share files like digital "toffees"—quickly, easily, and accessibly.

---

## 2. Problem Statement

Current solutions often lack the flexibility to support both **quick anonymous sharing** and **secure collaborative workspaces**. Users are frequently required to sign up even for one-time transfers, while collaboration platforms fail to offer streamlined file sharing without login. This creates a need for a unified platform that supports both modes effectively.

---

## 3. Objectives

* Enable file sharing **without login** for quick and anonymous use.
* Support **secure user authentication** using JWT and password hashing.
* Allow users to **create and join workspaces** with access via username and password.
* Provide functionality to **add, edit, and delete** files inside a workspace.
* Implement **role-based permissions** (viewer, editor, owner).
* Offer secure **edit/delete controls** and **access codes** for private folders.
* Provide a clean, **responsive user interface** accessible from any device.

---

## 4. Scope

### 4.1 Anonymous Sharing

* Drag-and-drop interface for instant upload.
* Generate temporary shareable links.
* Auto-expiry of shared files after 24 hours.

### 4.2 Registered Users & Workspaces

* JWT-based login system with hashed password storage.
* Users can:

  * Register/login with secure credentials.
  * Create new workspaces or join existing ones using an invite or access code.
  * Add, edit, or delete files within a workspace.
  * Set folder as public, private, or code-accessible.

### 4.3 Collaboration Workspace

* Shared workspaces visible only to joined users.
* Workspace-level permissions (viewer/editor/owner).
* Co-editing of documents and in-app commenting/chat.
* Recycle bin for deleted items and version control for updated files.

### 4.4 Folder & File Access Control

* Invite-based or code-based access for restricted folders.
* Unauthorized access is denied at folder level.
* Role-specific actions allowed based on permission.

---

## 5. Key Features

* ✨ **Share files like digital toffees**
* ⚡ **One-click anonymous upload and sharing**
* 🔐 **User registration and secure login (JWT + bcrypt)**
* 📂 **Create and manage workspaces**
* 🔗 **Invite users via code or link**
* 📅 **Add/edit/delete files in workspace folders**
* 🖊️ **Real-time collaboration: comments, co-editing**
* ⚖️ **Role-based actions: rename, delete, upload**
* 📁 **Recycle bin and version control**
* 📱 **Fully responsive UI with mobile-friendly design**
* 📊 **Dashboard with role-based file activity analytics**
* ⏳ **Scheduled uploads & automated file expiry**

---

## 6. Functional Requirements

| Feature                | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| Anonymous File Sharing | Drag-drop UI, temporary link generation, 24-hour auto-expiry |
| User Authentication    | Secure login/register using JWT and bcrypt                   |
| Workspace Management   | Users can create or join shared workspaces                   |
| File Management        | Add/edit/delete files with permission control                |
| Collaboration Tools    | Real-time co-editing, comments, chat                         |
| Access Control         | Invite links, workspace access codes, role-based restriction |
| Admin Dashboard        | View user activity, file logs, workspace stats               |
| Recycle Bin            | Restore or permanently delete files                          |
| Version Control        | Maintain older versions of modified files                    |
| Responsive UI          | Fully functional on desktops and mobile devices              |

---

## 7. Non-Functional Requirements

| Requirement  | Description                                                               |
| ------------ | ------------------------------------------------------------------------- |
| Performance  | File uploads/downloads should process within 3 seconds (<=100MB).         |
| Scalability  | System should support 10,000 concurrent users.                            |
| Security     | Data encrypted in-transit (HTTPS), password hashing, token-based sessions |
| Availability | System uptime >= 99.5% with backups every 6 hours                         |
| Usability    | Minimalist UI with drag-and-drop, clear tooltips, accessible design       |

---

## 8. Technology Stack (Proposed)

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Frontend   | HTML5, CSS3, JavaScript, React.js       |
| Backend    | Node.js, Express.js                     |
| Database   | MongoDB (NoSQL) or PostgreSQL (RDBMS)   |
| Auth       | JWT (JSON Web Token), bcrypt            |
| Storage    | AWS S3 / Firebase Storage / Local FS    |
| Deployment | Vercel / Render / Heroku / DigitalOcean |
| Versioning | GitHub                                  |

---

## 9. Project Timeline (Suggested)

| Week | Milestone                                    |
| ---- | -------------------------------------------- |
| 1    | Requirement analysis, wireframes             |
| 2–3  | Anonymous file upload & expiry system        |
| 4–5  | User auth system (JWT) + secure dashboard    |
| 6    | Workspace creation and role-based access     |
| 7    | File management (add/edit/delete in folders) |
| 8    | Real-time collaboration (chat, comments)     |
| 9    | Recycle bin & version control                |
| 10   | Final review, deployment, documentation      |

---

## 10. Conclusion

This project offers a hybrid file-sharing experience, merging the speed of **anonymous file transfers** with the structure of **secure, collaborative workspaces**. Users can share files like digital toffees for one-time use or collaborate in shared workspaces with structured permissions. The platform ensures flexibility, usability, and security in all use cases. 