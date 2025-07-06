"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, Target, Send, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import emitWithErrorHandling from "@/tools/emitWithErrorHandling";
import socket from "@/tools/mysocket";
import { useGame } from "@/contexts/GameContext";
import { useRouter } from 'next/navigation';


const Game = () => {
  const { username, setUsername, roomCode, players, setPlayers, isHost, setIsHost, gameState, round, timeLeft, currentTarget, progressPercentage, setProgressPercentage, leaderboard, score, canSubmitPrompt, setCanSubmitPrompt, recentScores } = useGame();
  const [prompt, setPrompt] = useState("");

  const router = useRouter();

  useEffect(() => {
    console.log("Players", players);
    console.log("Username", username)
    console.log("Is Host", isHost);
    console.log("Game State", gameState);

    socket.on("goToResultsPage", () => {
        router.push(`/room/${roomCode}/results`);
    });

    emitWithErrorHandling(socket, 'playerReady', { roomCode: roomCode, username: username });

    // Anti-cheat measures
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable copy/paste/cut shortcuts
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
      // Disable F12 developer tools
      // if (e.key === 'F12') {
      //   e.preventDefault();
      // }
      // Disable Ctrl+Shift+I (developer tools)
      // if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      //   e.preventDefault();
      // }
      // Disable Ctrl+U (view source)
      // if (e.ctrlKey && e.key === 'u') {
      //   e.preventDefault();
      // }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste only in the prompt input
      const target = e.target as HTMLElement;
      if (!target.closest('input[placeholder*="Write the perfect prompt"]')) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Disable prompt submission when game is not playing or time runs out
  useEffect(() => {
    if (gameState !== "playing" || timeLeft <= 0) {
      setCanSubmitPrompt(false);
    }
  }, [gameState, timeLeft, setCanSubmitPrompt]);

  
  const handleSubmitPrompt = () => {
    if (!prompt.trim()) return;
    setCanSubmitPrompt(false);
    emitWithErrorHandling(socket, 'submitPrompt', { roomCode: roomCode, username: username, prompt: prompt });

    setPrompt("");
  };

  
  
  
  return (
    <>
      {gameState === "playing" && (
        <div className="min-h-screen bg-background p-4 select-none" style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}>
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-sm font-mono">
                  Room: {roomCode}
                </Badge>
                <Badge variant="secondary">
                  Round {round}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">{players.length} players</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Game Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Timer */}
                <Card className="bg-card/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Clock className={`w-6 h-6 ${timeLeft <= 10 ? 'text-danger-red animate-timer-warning' : 'text-primary'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Time Remaining</span>
                          <span className={`text-xl font-bold font-mono ${timeLeft <= 10 ? 'animate-timer-warning' : ''}`}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <Progress 
                          value={progressPercentage} 
                          className={`h-3 ${timeLeft <= 10 ? 'glow-danger' : ''}`}
                          indicatorClassName={timeLeft <= 10 ? 'bg-red-500 animate-pulse' : undefined}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Target String */}
                <Card className="bg-card/50 backdrop-blur-sm border-primary/20 glow-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Target String
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-mono bg-muted/50 p-4 rounded-lg text-center" style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}>
                      "{currentTarget}"
                    </div>
                  </CardContent>
                </Card>

                {/* Prompt Input */}
                <Card className="bg-card/50 backdrop-blur-sm border-accent/20">
                  <CardHeader>
                    <CardTitle>Your Prompt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Write the perfect prompt that would generate the target string..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="text-lg p-4 h-auto"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitPrompt()}
                      disabled={gameState !== "playing" || !canSubmitPrompt}
                      style={{
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        msUserSelect: 'text'
                      }}
                    />
                    <Button 
                      onClick={handleSubmitPrompt}
                      disabled={!prompt.trim() || gameState !== "playing" || !canSubmitPrompt}
                      className="w-full gradient-neon text-background font-semibold hover:scale-105 transition-all"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Prompt
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Leaderboard */}
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-accent/20 glow-success overflow-y-auto h-[393px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                          player.username === username ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'
                        } ${index === 0 ? 'glow-success animate-glow-pulse' : ''}`}
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
                            <div className="font-semibold">{player.username}</div>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${index === 0 ? 'animate-score-bump' : ''}`}>
                          {player.score}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Submissions */}
                <Card className="bg-card/50 backdrop-blur-sm border-accent/20 overflow-hidden h-[200px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recent Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0.5 overflow-y-auto [&::-webkit-scrollbar]:hidden pt-0" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                      {recentScores.slice().reverse().map((score, index) => (
                        <div key={index} className="text-xs p-2 bg-muted/20 rounded flex justify-between">
                          <div className="font-semibold text-muted-foreground">{score.username}</div>
                          <div className="font-semibold text-primary">{score.score}</div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Game;