import socket from 'socket.io-client';

let socketInstance = null;


export const initializeSocket = (projectId) => {

    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token')
        },
        query: {
            projectId
        }
    }); 
    socketInstance.on("connect", () => {
        console.log("✅ Connected to server:", socketInstance.id);
    });
    

    socketInstance.on("disconnect", () => {
        console.warn("❌ Disconnected from server.");
    });

    socketInstance.on("connect_error", (err) => {
        console.error("⚠️ Connection error:", err.message);
    });

    return socketInstance;
}

export const receiveMessage = (eventName, cb) => {
    if (!socketInstance) {
        console.error("⚠️ Socket is not initialized.");
        return;
    }

    socketInstance.on(eventName, (data) => {
        console.log(`📩 Message received on ${eventName}:`, data);
        cb(data);
    });
};

export const sendMessage = (eventName, data) => {
    socketInstance.emit(eventName, data);
}

