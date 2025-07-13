"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Crown, Trophy, Medal, Award, Home, RotateCcw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import emitWithErrorHandling from '@/tools/emitWithErrorHandling';
import socket from '@/tools/mysocket';
import Image from "next/image";
import { useGame } from '@/contexts/GameContext';

interface PlayerScore {
    username: string;
    score: number;
}

const ResultsPage = () => {
    const params = useParams();
    const roomCode = params.roomId as string;
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<PlayerScore[]>([]);
    const [particles, setParticles] = useState<{ left: string; top: string; delay: string; duration: string }[]>([]);
    
    // Use game context
    const { username, setRoomCode, setGameState } = useGame();

    useEffect(() => {
        // Set room code in context
        setRoomCode(roomCode);
        setGameState('results');

        // TODO: Get actual game results from server
        emitWithErrorHandling(socket, 'getGameResults', { roomCode: roomCode });

        socket.on('gameResults', ({ results }) => {
            console.log("Game results received", results);
            setLeaderboard(results);

            emitWithErrorHandling(socket, 'disconnectLobby', { roomCode: roomCode, username: username });
        });

        return () => {
            socket.off('gameResults');
        };
    }, [roomCode, setRoomCode, setGameState]);

    const getPositionIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="h-6 w-6 text-yellow-500" />;
            case 1: return <Medal className="h-6 w-6 text-gray-400" />;
            case 2: return <Award className="h-6 w-6 text-orange-600" />;
            default: return <Trophy className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const onPlayAgain = () => {
        console.log('Play again');
        emitWithErrorHandling(socket, 'gameEndRejoin', { roomCode: roomCode, username: username });
        router.push(`/room/${roomCode}/waitingroom`);
    };

    const onReturnHome = () => {
        console.log('Return to home');
        router.push('/');
    };

    // Generate particles on client-side only to avoid hydration mismatch
    useEffect(() => {
        const generatedParticles = Array.from({ length: 12 }, (_, i) => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${i * 0.3}s`,
            duration: `${2 + Math.random() * 2}s`
        }));
        setParticles(generatedParticles);
    }, []);

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-fit flex flex-row mx-auto mt-12 items-center gap-2">
                        <Image src="/dog.gif" width={200} height={200} alt="Big Gurt" className="h-16 w-24"/>
                        <h1 className="text-4xl font-bold glow-primary">
                            Game Results
                        </h1>
                    </div>
                    <p className="text-muted-foreground">Final scores from Room {roomCode}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Victory Animation */}
                    <div className="lg:col-span-2">
                        <Card className="p-8 bg-card border-border shadow-card h-96 lg:h-[450px]">
                            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-accent/10 via-primary/10 to-secondary/10 rounded-lg border border-primary/20 relative overflow-hidden">
                                {/* Winner Celebration */}
                                <div className="text-center space-y-6 z-10">
                                    <div className="flex items-center justify-center gap-4">
                                        <Crown className="h-16 w-16 text-yellow-500 animate-bounce" />
                                        <div>
                                            <h2 className="text-3xl font-bold text-foreground mb-2">🎉 Winner! 🎉</h2>
                                            <p className="text-xl text-accent font-semibold">{leaderboard[0]?.username}</p>
                                            <p className="text-lg text-muted-foreground">{leaderboard[0]?.score} points</p>
                                        </div>
                                        <Crown className="h-16 w-16 text-yellow-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </div>

                                {/* Celebration particles */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {particles.map((particle, index) => (
                                        <div
                                            key={index}
                                            className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
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

                    {/* Leaderboard */}
                    <div className="space-y-6">
                        <Card className="p-4 bg-card border-border shadow-card bg-card/50 backdrop-blur-sm border-accent/20">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <h3 className="font-bold text-foreground">
                                    Final Leaderboard
                                </h3>
                            </div>
                            
                            <div className="space-y-2 h-[225px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {leaderboard.map((player, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 animate-fade-in ${
                                            index === 0 ? 'bg-accent/20 border border-accent/30' :
                                            index === 1 ? 'bg-secondary/20 border border-secondary/30' :
                                            index === 2 ? 'bg-warning-orange/20 border border-warning-orange/30' :
                                            'bg-muted/20 border border-muted/30'
                                        }`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                index === 0 ? 'bg-accent text-accent-foreground' :
                                                index === 1 ? 'bg-secondary/20 text-secondary' :
                                                index === 2 ? 'bg-warning-orange/20 text-warning-orange' :
                                                'bg-muted/50 text-muted-foreground'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className={`font-semibold ${
                                                    player.username === username ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                    {player.username}
                                                    {player.username === username && ' (You)'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {player.score} pts
                                                </div>
                                            </div>
                                        </div>
                                        {getPositionIcon(index)}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Action Buttons */}
                        <Card className="p-4 bg-card border-border shadow-card">
                            <div className="space-y-3">
                                <Button
                                    onClick={onPlayAgain}
                                    className="w-full bg-primary text-primary-foreground hover:scale-105 transition-all duration-300"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Play Again
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    onClick={onReturnHome}
                                    className="w-full hover:scale-105 transition-all"
                                >
                                    <Home className="h-4 w-4 mr-2" />
                                    Return Home
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
    
};

export default ResultsPage; 