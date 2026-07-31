### Project Statistics
Models: 23

Services: 25

Controllers: 22


## 1. How to run project

### Launch the Backend

cd backend

npm install

npm start

Backend will run at:

http://localhost:4000

### Launch the Frontend

cd frontend

npm install

npm run dev

Frontend will run at:

http://localhost:5173


## 2. Admin Secret Key : Nam



## 3. Technology Stack

| **Technology Category**       | **Library / Solution**           | **Purpose**                                                                                                                                   |
| :---------------------------- | :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server Framework**          | Express.js                       | Develops RESTful APIs for the fashion e-commerce platform.                                                                                    |
| **Database**                  | MongoDB, Mongoose                | Stores and manages application data, including users, products, shopping carts, orders, inventory, notifications, and membership information. |
| **Security & Authentication** | JWT, bcrypt, validator           | Supports user registration, authentication, role-based access control, password hashing, and input validation.                                |
| **Image Management**          | Multer, Cloudinary               | Handles image uploads and cloud-based storage for product images, banners, and user avatars.                                                  |
| **Real-time Communication**   | Socket.IO                        | Enables real-time notifications, order status updates, and customer–administrator messaging and so on.                                                  |
| **Online Payment**            | Stripe, MoMo (Simulation)        | Processes online payments and manages the pending checkout workflow.                                                                          |
| **Email Service**             | Nodemailer                       | Sends password reset emails, order confirmation emails, and other system-generated notifications.                                             |
| **Social Authentication**     | Google OAuth, Facebook Graph API | Provides user authentication through Google and Facebook accounts.                                                                            |
| **AI Chatbot**                | OpenRouter API                   | Supports AI-powered customer assistance and clothing size recommendations.                                                                    |
