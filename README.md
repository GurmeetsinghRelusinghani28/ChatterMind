# AiChatApplication

This is a full-stack web application that allows multiple users to connect, chat, and collaborate on coding in real-time. Built using the MERN stack (MongoDB, Express, React, Node.js), it integrates Socket.io for real-time updates and Google Gemini AI for smart code assistance.

## Features

- **Real-time Chat**: Multi-user chat with Socket.io integration
- **Code Collaboration**: Collaborate on coding projects in real-time
- **AI Assistance**: Google Gemini AI integration for code suggestions and smart assistance
- **User Authentication**: Secure user authentication and session management
- **Responsive UI**: Modern, responsive React-based user interface
- **Database**: MongoDB for persistent data storage

## Tech Stack

- **Frontend**: React, Socket.io-client
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Real-time**: Socket.io
- **AI Integration**: Google Gemini API

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google Gemini API Key

### Setup

1. Clone the repository
2. Install backend dependencies: `npm install`
3. Install frontend dependencies: `cd client && npm install`
4. Configure environment variables
5. Start the server: `npm start`
6. Start the frontend: `cd client && npm start`

## Usage

1. Create a user account or log in
2. Join or create a chat room
3. Start collaborating with other users
4. Use AI assistance for code suggestions

## Project Structure

```
AiChatApplication/
├── server/
│   ├── models/
│   ├── routes/
│   └── app.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
└── README.md
```

## Contributing

Contributions are welcome! Please follow the code style guidelines and submit pull requests.

## License

This project is licensed under the MIT License.
