"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '@/tools/mysocket';

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
    const [isHost, setIsHost] = useState<boolean>(true);
    const [gameState, setGameState] = useState<'waiting' | 'playing' | 'results'>('waiting');

    useEffect(() => {
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
        socket.on("startGame", () => {
            console.log("Game starting - updating context");
            setGameState('playing');
        });

        socket.on("gameEnd", () => {
            console.log("Game ended - updating context");
            setGameState('results');
        });

        return () => {
            socket.off("getUsername");
            socket.off('updateUserList');
            socket.off("startGame");
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
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}; 