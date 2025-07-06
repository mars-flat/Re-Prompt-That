"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '@/tools/mysocket';
import { toast } from '@/hooks/use-toast';

interface GameContextType {
    username: string;
    setUsername: (username: string) => void;
    roomCode: string;
    setRoomCode: (roomCode: string) => void;
    players: string[];
    setPlayers: (players: string[]) => void;
    isHost: boolean;
    setIsHost: (isHost: boolean) => void;
    gameState: 'waiting' | 'playing' | 'results';
    setGameState: (state: 'waiting' | 'playing' | 'results') => void;
    round: number;
    setRound: (round: number) => void;
    timeLeft: number;
    setTimeLeft: (timeLeft: number) => void;
    currentTarget: string;
    setCurrentTarget: (currentTarget: string) => void;
    progressPercentage: number;
    setProgressPercentage: (progressPercentage: number) => void;
    score: number;
    leaderboard: {username: string, score: number}[];
    canSubmitPrompt: boolean;
    setCanSubmitPrompt: (canSubmitPrompt: boolean) => void;
    recentScores: {username: string, score: number}[];
    setRecentScores: (recentScores: {username: string, score: number}[]) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider. Make sure your component is wrapped with GameProviderWrapper.');
    }
    return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [username, setUsername] = useState<string>('');
    const [roomCode, setRoomCode] = useState<string>('');
    const [players, setPlayers] = useState<string[]>([]);
    const [score, setScore] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<{username: string, score: number}[]>([]);
    const [isHost, setIsHost] = useState<boolean>(true);
    const [gameState, setGameState] = useState<'waiting' | 'playing' | 'results'>('waiting');
    const [canSubmitPrompt, setCanSubmitPrompt] = useState<boolean>(false);
    const [recentScores, setRecentScores] = useState<{username: string, score: number}[]>([]);

    // Game state variables
    const [round, setRound] = useState(1);
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentTarget, setCurrentTarget] = useState("");
    const [progressPercentage, setProgressPercentage] = useState(100);

    useEffect(() => {
        socket.on('error', (error) => {
            console.log("Socket error:", error);
            toast({
                title: error.title,
                description: error.message,
            });
        });

        // Listen for username updates from server
        socket.on("getUsername", (receivedUsername: string) => {
            console.log("Username received from server:", receivedUsername);
            setUsername(receivedUsername);
        });

        // Listen for player list updates
        socket.on('updateUserList', (userList: string[]) => {
            console.log("User list updated:", userList);
            setPlayers(userList);
        });

        // Listen for game state changes
        socket.on("gameStarted", (currentQuestion: string) => {
            console.log("currentQuestion", currentQuestion)
            console.log("Game starting - updating context");
            setGameState('playing');
            setRound(1);
            setTimeLeft(60);
            setProgressPercentage(100);
            setScore(0);
            setCurrentTarget(currentQuestion);
            setRecentScores([]);
            // Initialize leaderboard with current players at 0 score
            setPlayers(currentPlayers => {
                console.log("Current players for leaderboard:", currentPlayers);
                const initialLeaderboard = currentPlayers.map(player => ({username: player, score: 0}));
                setLeaderboard(initialLeaderboard);
                return currentPlayers;
            });
            setCanSubmitPrompt(true);
        });

        socket.on("timerMessage", (timeLeft: number) => {
            console.log("Timer message received:", timeLeft);
            setTimeLeft(timeLeft);
        });

        socket.on("promptScored", ({username, score, leaderboard, aiResponse, userPrompt}) => {
            console.log("Prompt scored:", score, leaderboard, aiResponse, userPrompt);
            setLeaderboard(leaderboard);
            setScore(score);
            setRecentScores(prev => [...prev, {username: username, score: score}]);
            setCanSubmitPrompt(true);
            toast({
                title: `You scored ${score} points!`,
                description: `${aiResponse}`,
                variant: "neon",
            });
        });

        socket.on("scoreUpdate", ({username, leaderboard, score}) => {
            console.log("Score update received:", username, leaderboard, score);
            setLeaderboard(leaderboard);
            setRecentScores(prev => [...prev, {username: username, score: score}]);
            setScore(score);
            // toast({
            //     title: `Updated Results`,
            //     description: `${username} scored ${score} points!`,
            //     variant: "default",
            // });
        });

        socket.on("gameEnd", () => {
            console.log("Game ended - updating context");
            setGameState('results');
        });

        return () => {
            socket.off("getUsername");
            socket.off('updateUserList');
            socket.off("gameStarted");
            socket.off("timerMessage");
            socket.off("gameEnd");
        };
    }, []);

    const value: GameContextType = {
        username,
        setUsername,
        roomCode,   
        setRoomCode,
        players,
        setPlayers,
        isHost,
        setIsHost,
        gameState,
        setGameState,
        round,
        setRound,
        timeLeft,
        setTimeLeft,
        currentTarget,
        setCurrentTarget,
        progressPercentage,
        setProgressPercentage,
        score,
        leaderboard,
        canSubmitPrompt,
        setCanSubmitPrompt,
        recentScores,
        setRecentScores,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}; 