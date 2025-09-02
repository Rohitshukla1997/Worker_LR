// // src/hooks/useSocket.js
// import { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";

// const useSocket = (options = {}) => {
//     const [isConnected, setIsConnected] = useState(false);
//     const socketRef = useRef(null);

//     useEffect(() => {
//         const TOKEN = sessionStorage.getItem("crdnsMaintToken");
//         const url = `${import.meta.env.VITE_API_URL}`;

//         const socket = io(url, {
//             transports: ["websocket"],
//             reconnectionAttempts: 5,
//             reconnectionDelay: 1000,
//             auth: {
//                 token: TOKEN,
//             },
//             ...options,
//         });

//         socketRef.current = socket;

//         socket.on("connect", () => {
//             console.log(" Socket connected:", socket.id);
//             setIsConnected(true);
//         });

//         socket.on("disconnect", () => {
//             console.log("Socket disconnected");
//             setIsConnected(false);
//         });

//         // cleanup socket on unmount
//         return () => {
//             socket.disconnect();
//             console.log("Socket cleanup (disconnected)");
//         };
//     }, []);

//     return {
//         socket: socketRef.current,
//         isConnected,
//     };
// };

// export default useSocket;



// ------------------------------------------------------------ 

import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL, {
    autoConnect: false,
    auth: {
        token: sessionStorage.getItem("crdnsMaintToken") || "",
    },
    transports: ["websocket"],
});

