"use client"

import { Code, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import emitWithErrorHandling from "@/tools/emitWithErrorHandling";
import socket from "@/tools/mysocket";
import Image from "next/image";
    
export default function Home() {
    const [roomCode, setRoomCode] = useState("");
    const [joinGameUsername, setJoinGameUsername] = useState("");
    const [createGameUsername, setCreateGameUsername] = useState("");

    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {   
        socket.on('roomJoined', ({ roomCode }) => {
            console.log("Room joined:", roomCode);
            router.push(`/room/${roomCode}/waitingroom`);
        });
    }, [router, toast]);

    const handleJoinGame = () => {
        console.log("Joining game with code:", roomCode);
        emitWithErrorHandling(socket, 'joinRoom', { roomCode: roomCode, username: joinGameUsername });
    }

    const handleCreateGame = () => {
        console.log("Creating game");
        emitWithErrorHandling(socket, 'createRoom', { username: createGameUsername });
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 animate-fade-in mt-24">
                <div className="inline-flex items-center gap-2 text-4xl font-bold glow-primary">
                    <Image src="/dog.gif" width={200} height={200} alt="Big Gurt" className="h-16 w-24"/>
                    Re-Prompt That
                </div>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    The ultimate prompt writing challenge. Given a target string, write the perfect prompt that would generate it.
                </p>
            </div>

            {/* Game Actions */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full">
                {/* Join Game */}
                <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all hover:glow-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Join Game
                        </CardTitle>
                        <CardDescription>
                            Enter a room code to join an existing game
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Enter room code..."
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            className="text-center text-lg font-mono tracking-wider"
                            maxLength={6}
                            onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                        />
                        <Input
                            placeholder="Enter username..."
                            value={joinGameUsername}
                            onChange={(e) => setJoinGameUsername(e.target.value)}
                            className="text-center text-lg font-mono tracking-wider"
                            onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
                        />
                        <Button 
                            onClick={handleJoinGame} 
                            className="w-full gradient-primary text-primary-foreground font-semibold hover:scale-105 transition-all text-white"
                            disabled={!roomCode.trim() || !joinGameUsername.trim()}
                        >
                            Join Game
                        </Button>
                    </CardContent>
                </Card>

                {/* Create Game */}
                <Card className="bg-card/50 backdrop-blur-sm border-secondary/20 hover:border-secondary/40 transition-all hover:glow-secondary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Create Game
                        </CardTitle>
                        <CardDescription>
                            Start a new game and invite friends
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-sm text-muted-foreground h-[60px]"></div>
                        <Input
                            placeholder="Enter username..."
                            value={createGameUsername}
                            onChange={(e) => setCreateGameUsername(e.target.value)}
                            className="text-center text-lg font-mono tracking-wider"
                            onKeyDown={(e) => e.key === "Enter" && handleCreateGame()}
                        />
                        <Button 
                            onClick={handleCreateGame}
                            className="w-full bg-secondary text-secondary-foreground font-semibold hover:scale-105 transition-all glow-secondary"
                            disabled={!createGameUsername.trim()}
                        >
                            Create New Game
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* How to Play */}
            <Card className="bg-card/30 backdrop-blur-sm border-accent/20 max-w-4xl w-full">
                <CardHeader>
                    <CardTitle className="text-center">How to Play</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-xl font-bold text-primary">1</span>
                        </div>
                        <h3 className="font-semibold">See the Target</h3>
                        <p className="text-sm text-muted-foreground">You'll be shown a target string that needs to be generated</p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-xl font-bold text-secondary">2</span>
                        </div>
                        <h3 className="font-semibold">Write the Prompt</h3>
                        <p className="text-sm text-muted-foreground">Craft the perfect prompt that would generate that exact string</p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-xl font-bold text-accent">3</span>
                        </div>
                        <h3 className="font-semibold">Score Points</h3>
                        <p className="text-sm text-muted-foreground">Get points based on how likely your prompt would generate the target</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
