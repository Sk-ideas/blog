# Blog CMS API

A powerful RESTful API built for a Blog Content Management System (CMS), developed using Node.js and Express with PostgreSQL as the database. This system allows user management, post creation, media uploads, comments, and post analytics with secure JWT authentication.


## 📚 Table of Contents

- [📌 Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📬 API Endpoints](#-api-endpoints)
- [🧪 Postman Usage](#-postman-usage)
- [⚙️ Environment Variables](#-environment-variables)
- [📦 Deployment](#-deployment)
- [🧑‍💻 Contributing](#-contributing)
- [📄 License](#-license)


## 📌 Overview

This project provides a complete backend for a blogging platform with user roles like Reader, Author, Editor, and Admin. Authors can write content, upload images, and manage their posts. Readers can comment, and Admins can moderate content and users.


## ✨ Features

- ✅ JWT Authentication
- 📝 Create/Update/Delete Blog Posts
- 📂 Media Upload with Thumbnail Generation (Sharp)
- 💬 Commenting System (with likes and threaded replies)
- 📊 Post Analytics (views, likes)
- 📎 Role-Based Access Control


## 🛠️ Tech Stack

| Layer              | Technology       |
|-------------------|------------------|
| Runtime            | Node.js          |
| Framework          | Express.js       |
| Database           | PostgreSQL       |
| ORM                | Sequelize        |
| Authentication     | JWT              |
| Image Processing   | Sharp            |
| Process Manager    | PM2              |
| Deployment Server  | NGINX            |


## 🚀 Getting Started

### 1. Clone Repository

git clone https://github.com/Sk-ideas/blog-cms-api
cd blog-cms-api

### 2. Install Dependencies

npm install

### 3. Setup Environment

cp .env.example .env
# Fill in all required values in .env

### 4. Database Initialization

npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

### 5. Start Development Server

npm run dev


## 📬 API Endpoints

### ✅ Authentication

| Endpoint              | Method | Description          |
|-----------------------|--------|----------------------|
| `/api/auth/register`  | POST   | Register new user    |
| `/api/auth/login`     | POST   | Login existing user  |
| `/api/auth/me`        | GET    | Get current user     |

### 👤 Users

| Endpoint               | Method | Access        | Description              |
|------------------------|--------|---------------|--------------------------|
| `/api/users`           | GET    | Admin         | List all users           |
| `/api/users/:id`       | GET    | Admin/Self    | Get specific user        |
| `/api/users/:id`       | PUT    | Admin/Self    | Update user              |
| `/api/users/:id`       | DELETE | Admin         | Delete user              |

### 📝 Posts

| Endpoint               | Method | Access       | Description              |
|------------------------|--------|--------------|--------------------------|
| `/api/posts`           | GET    | Public       | List all posts           |
| `/api/posts/:id`       | GET    | Public       | Get a single post        |
| `/api/posts`           | POST   | Author+      | Create a post            |
| `/api/posts/:id`       | PUT    | Author+      | Update a post            |
| `/api/posts/:id`       | DELETE | Author+      | Delete a post            |

### 🖼️ Media

| Endpoint               | Method | Access       | Description              |
|------------------------|--------|--------------|--------------------------|
| `/api/media`           | POST   | Author+      | Upload media             |
| `/api/media`           | GET    | Editor+      | List uploaded media      |
| `/api/media/:id`       | GET    | Owner/Editor+| Get media details        |
| `/api/media/:id`       | DELETE | Owner/Admin  | Delete media             |

### 💬 Comments

| Endpoint                                 | Method | Description                  |
|------------------------------------------|--------|------------------------------|
| `/api/posts/:postId/comments`            | POST   | Add comment to a post        |
| `/api/comments/:id/like`                 | POST   | Like a comment               |


## 🧪 Postman Usage

### 🔐 1. Register User

curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "role": "reader"
}'

### 🔑 2. Login User

curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "password123"
}'

### 🙍‍♂️ 3. Get Current User

curl -X GET http://localhost:3000/api/auth/me \
-H "Authorization: Bearer <JWT_TOKEN>"

### 📄 4. Get All Posts

curl -X GET "http://localhost:3000/api/posts?status=published&page=1&limit=5"

### ✍️ 5. Create Post

curl -X POST http://localhost:3000/api/posts \
-H "Authorization: Bearer <JWT_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "title": "New Post",
  "content": "Post content...",
  "excerpt": "Short excerpt",
  "status": "draft",
  "categories": [1],
  "tags": [2],
  "featured": true
}'

### 📷 6. Upload Media

curl -X POST http://localhost:3000/api/media \
-H "Authorization: Bearer <JWT_TOKEN>" \
-F "image=@/path/to/image.jpg"

### 💬 7. Add Comment

curl -X POST http://localhost:3000/api/posts/1/comments \
-H "Authorization: Bearer <JWT_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "content": "Great post!"
}'

### 👍 8. Like Comment

curl -X POST http://localhost:3000/api/comments/1/like \
-H "Authorization: Bearer <JWT_TOKEN>" \
-H "Content-Type: application/json" \
-d '{ "action": "like" }'

### 🗑️ 9. Delete Post

curl -X DELETE http://localhost:3000/api/posts/1 \
-H "Authorization: Bearer <JWT_TOKEN>"


## ⚙️ Environment Variables

Make sure to configure a `.env` file in the root directory:

# Server Config
PORT=3000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=blog_cms

# JWT Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d

# File Uploads
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads


## 📦 Deployment

### Step 1: Install production dependencies

npm install --production

### Step 2: Use PM2 to keep app running

npm install -g pm2
pm2 start app.js

### Step 3: Example NGINX Config


server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧑‍💻 Contributing

1. Fork the repo
2. Create your feature branch `git checkout -b feature/feature-name`
3. Commit your changes `git commit -am 'Add some feature'`
4. Push to the branch `git push origin feature/feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
```

---

Let me know if you want this as a downloadable `.md` file or if you'd like a Postman collection to go along with it!