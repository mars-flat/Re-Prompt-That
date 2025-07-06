"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Crown, Copy, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import emitWithErrorHandling from '@/tools/emitWithErrorHandling';
import socket from '@/tools/mysocket';
import Image from "next/image";
import { useGame } from '@/contexts/GameContext';

const WaitingRoom = () => {
    const params = useParams();
    const roomCode = params.roomId as string;
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [particles, setParticles] = useState<{ left: string; top: string; delay: string; duration: string }[]>([]);
    
    // Use game context
    const { username, setUsername, players, setPlayers, isHost, setIsHost, setRoomCode, gameState } = useGame();

    useEffect(() => {
        // Set room code in context
        setRoomCode(roomCode);

        emitWithErrorHandling(socket, 'getUserList', { roomCode: roomCode });

        // Note: updateUserList and getUsername are now handled by GameContext
        // but we still need the startGame listener for navigation
        socket.on("goToStartGame", () => {
            console.log("Starting game");
            router.push(`/room/${roomCode}/play`);
        });

        return () => {
            socket.off("goToStartGame");
        };
    }, [roomCode, setRoomCode, router]);
   

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
    };

    const canStartGame = players.length >= 1;

    const onStartGame = () => {
        emitWithErrorHandling(socket, 'startGame', { roomCode: roomCode });
    };

    const onLeaveRoom = () => {
        console.log('Leaving room');
        emitWithErrorHandling(socket, 'disconnectLobby', { roomCode: roomCode, username: username });
        router.push('/');
    };

    // Generate particles on client-side only to avoid hydration mismatch
    useEffect(() => {
        const generatedParticles = Array.from({ length: 6 }, (_, i) => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${i * 0.5}s`,
            duration: `${2 + Math.random() * 2}s`
        }));
        setParticles(generatedParticles);
    }, []);

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                <div className="w-fit flex flex-row mx-auto mt-12 items-center gap-2">
                    <Image src="/dog.gif" width={200} height={200} alt="Big Gurt" className="h-16 w-24"/>
                    <h1 className="text-4xl font-bold glow-primary">
                        Re-Prompt That
                    </h1>
                </div>
                </div>

                {/* Room Code */}
                <Card className="p-6 bg-card border-border shadow-card">
                <div className="text-center space-y-4">
                    <h2 className="text-xl font-bold text-foreground">Room Code</h2>
                    <div className="flex items-center justify-center gap-3">
                    <div className="px-8 py-4 bg-electric-blue rounded-lg border border-primary/20 glow-primary">
                        <span className="text-3xl font-mono font-bold text-background">
                        {roomCode}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={copyRoomCode}
                        className="border-electric-blue hover:bg-electric-blue/20 glow-primary transition-all hover:scale-110"
                    >
                        {copied ? (
                        <Check className="h-4 w-4 text-neon-green" />
                        ) : (
                        <Copy className="h-4 w-4 text-electric-blue" />
                        )}
                    </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                    Share this code with friends so they can join your game
                    </p>
                </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Animation Area */}
                <div className="lg:col-span-2">
                    <Card className="p-8 bg-card border-border shadow-card h-96 lg:h-[450px]">
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-lg border border-primary/20 relative overflow-hidden">
                        {/* Placeholder for animation */}
                        <div className="text-center space-y-4 animate-pulse">
                        <div className="w-32 h-32 bg-gradient-primary rounded-full mx-auto opacity-20 animate-glow"></div>
                        </div>

                         {/* DOG ANIMATION!! */}
                        <img
                            src="/dog.gif"
                            alt="dog"
                            className="absolute top-1/3 left-1/3 w-48 h-auto pointer-events-none"
                            style={{ animation: 'runAround 2s linear infinite' }}
                        />  
                        
                        {/* Floating particles animation */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {particles.map((particle, index) => (
                            <div
                            key={index}
                            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-pulse"
                            style={{
                                left: particle.left,
                                top: particle.top,
                                animationDelay: particle.delay,
                                animationDuration: particle.duration
                            }}
                            ></div>
                        ))}
                        </div>

                    </div>
                    </Card>
                </div>

                {/* Players List */}
                <div className="space-y-6">
                    <Card className="p-4 bg-card border-border shadow-card rounded-lg border text-card-foreground shadow-sm bg-card/50 backdrop-blur-sm border-accent/20 glow-success">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-neon-green glow-success" />
                        <h3 className="font-bold text-neon-green glow-success">
                        Players ({players.length})
                        </h3>
                    </div>
                    
                    <div className="space-y-2 h-[225px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {players.map((player, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 animate-fade-in ${
                                player === username ? 'bg-neon-green/20 border border-neon-green/30' :
                            'bg-muted/20 border border-muted/30'
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-center gap-3">
                            <span className={`font-medium ${
                                player === username ? 'text-foreground font-bold' : 'text-foreground'
                            }`}>
                                {player}
                                {player === username && ' (You)'}
                            </span>
                            </div>
                        </div>
                        ))}
                        
                        {players.length === 1 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Waiting for more players...</p>
                        </div>
                        )}
                    </div>
                    </Card>

                    {/* Game Controls */}
                    <Card className="p-4 bg-card border-border shadow-card">
                        <div className="space-y-3">
                            {isHost ? (
                            <Button
                                onClick={onStartGame}
                                disabled={!canStartGame}
                                className="w-full gradient-neon text-background hover:scale-105 transition-all duration-300 disabled:opacity-50 glow-success"
                            >
                                {canStartGame ? 'Start Game' : `Need ${2 - players.length} more player${2 - players.length !== 1 ? 's' : ''}`}
                            </Button>
                            ) : (
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                Waiting for host to start the game...
                                </p>
                            </div>
                            )}
                            
                            <Button
                            variant="outline"
                            onClick={onLeaveRoom}
                            className="w-full border-danger-red text-danger-red hover:bg-danger-red/10 hover:scale-105 transition-all"
                            >
                            Leave Room
                            </Button>
                        </div>
                    </Card>
                </div>
                </div>
            </div>
        </div>
    );
    
};

export default WaitingRoom;