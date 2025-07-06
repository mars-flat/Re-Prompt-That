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

    socket.emit(event, data, (response: any) => {
        socket.off('connect_error', handleError);
        
        console.log(`📨 Response for '${event}':`, response);
        
        if (response?.error) {
            console.log("🚨 Server returned error:", response.error);
            toast({
                title: response.error.title || "Server Error",
                description: response.error.message || response.error,
            });
        } else if (response?.success === false) {
            console.log("⚠️ Server returned success=false:", response);
            toast({
                title: "Request Failed",
                description: response.message || "Request was not successful",
            });
        } else {
            console.log("✅ Request successful:", response);
        }
    });
}

export default emitWithErrorHandling;