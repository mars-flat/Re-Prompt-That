"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Crown, Copy, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import emitWithErrorHandling from '@/tools/emitWithErrorHandling';
import socket from '@/tools/mysocket';

const WaitingRoom = () => {
    const params = useParams();
    const roomCode = params.roomId as string;
    const router = useRouter();
    const [isHost, setIsHost] = useState(true);
    const [playerName, setPlayerName] = useState('');
    const [copied, setCopied] = useState(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [particles, setParticles] = useState<{ left: string; top: string; delay: string; duration: string }[]>([]);

    useEffect(() => {

        emitWithErrorHandling(socket, 'getUserList', { roomCode: roomCode });

        socket.on('roomJoined', (roomCode: string) => {
            console.log(`Room is joined ${roomCode}`);
        });

        socket.on('updateUserList', (userList: any) => {
            console.log("User list updated", userList);
            setPlayers(userList);
        });
    }, []);
    

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
    };

    const canStartGame = players.length >= 2;

    const onStartGame = () => {
        console.log('Starting game');
    };

    const onLeaveRoom = () => {
        console.log('Leaving room');
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
                <h1 className="text-3xl font-bold glow-primary">
                    Re-Prompt That
                </h1>
                <p className="text-muted-foreground">Waiting for players to join...</p>
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
                    <Card className="p-8 bg-card border-border shadow-card h-96 lg:h-[500px]">
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 rounded-lg border border-primary/20 relative overflow-hidden">
                        {/* Placeholder for animation */}
                        <div className="text-center space-y-4 animate-pulse">
                        <div className="w-32 h-32 bg-gradient-primary rounded-full mx-auto opacity-20 animate-glow"></div>
                        <div className="space-y-2">
                            {/* <div className="h-4 bg-primary/20 rounded w-48 mx-auto"></div> */}
                            {/* <div className="h-4 bg-accent/20 rounded w-32 mx-auto"></div> */}
                        </div>
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
                    <Card className="p-4 bg-card border-border shadow-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-neon-green glow-success" />
                        <h3 className="font-bold text-neon-green glow-success">
                        Players ({players.length})
                        </h3>
                    </div>
                    
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {players.map((player, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 animate-fade-in glow-success ${
                            player === playerName ? 'bg-neon-green border border-neon-green/30' : 'bg-neon-green/80'
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-center gap-3">
                            <span className={`font-medium ${
                                player === playerName ? 'text-background font-bold' : 'text-background'
                            }`}>
                                {player}
                                {player === playerName && ' (You)'}
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

                    {/* Game Info */}
                    <Card className="p-4 bg-card border-border shadow-card">
                    <h4 className="font-bold text-electric-blue glow-primary mb-2">Game Rules</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 2-4 players can join</li>
                        <li>• Write prompts that generate target strings</li>
                        <li>• Closer matches = higher scores</li>
                        <li>• Multiple rounds of competition</li>
                    </ul>
                    </Card>
                </div>
                </div>
            </div>
        </div>
    );
    
};

export default WaitingRoom;