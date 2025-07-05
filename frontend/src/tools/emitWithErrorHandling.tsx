import { Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";

const emitWithErrorHandling = (socket: Socket, event: string, data: any) => {
    // Check if socket is connected
    if (!socket.connected) {
        toast({
            title: "❌ Not Connected",
            description: "Unable to connect to game server. Please try again.",
        });
        return;
    }

    // Set up one-time error handler for this specific emit
    const handleError = (error: any) => {
        console.log("Connection error during emit:", error);
        toast({
            title: "Connection Error",
            description: "Failed to connect to server. Please try again.",
        });
    };

    socket.once('connect_error', handleError);
    
    // Set a timeout to remove the error handler if no error occurs
    const cleanup = setTimeout(() => {
        socket.off('connect_error', handleError);
    }, 5000);

    socket.emit(event, data, (response: any) => {
        clearTimeout(cleanup);
        socket.off('connect_error', handleError);
        
        if (response?.error) {
            toast({
                title: "Server Error",
                description: response.error.message || response.error,
            });
        }
    });
}

export default emitWithErrorHandling;