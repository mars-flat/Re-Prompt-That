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

// Mock data for demonstration
const TARGET_STRINGS = [
  "The quick brown fox jumps over the lazy dog",
  "To be or not to be, that is the question",
  "Hello, World!",
  "The future is bright and full of possibilities",
  "Machine learning will revolutionize everything"
];

interface Player {
  id: string;
  name: string;
  score: number;
  lastPrompt?: string;
}

const Game = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [currentTarget, setCurrentTarget] = useState(TARGET_STRINGS[0]);
  const [prompt, setPrompt] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [round, setRound] = useState(1);
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "You", score: 0 },
    { id: "2", name: "Alice", score: 0 },
    { id: "3", name: "Bob", score: 0 },
    { id: "4", name: "Charlie", score: 0 }
  ]);
  const [isGameActive, setIsGameActive] = useState(true);

  // Timer effect
  useEffect(() => {
    if (!isGameActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRoundEnd();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, timeLeft]);

  // Simulate other players submitting prompts
  useEffect(() => {
    if (!isGameActive) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        simulatePlayerSubmission();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isGameActive, round]);

  const simulatePlayerSubmission = () => {
    const botNames = ["Alice", "Bob", "Charlie"];
    const availableBot = players.find(p => botNames.includes(p.name) && !p.lastPrompt);
    
    if (availableBot) {
      const mockPrompts = [
        "Generate a sentence about animals",
        "Write something philosophical",
        "Create a greeting message",
        "Describe the future optimistically",
        "Explain AI technology"
      ];
      
      setPlayers(prev => prev.map(p => 
        p.id === availableBot.id 
          ? { ...p, lastPrompt: mockPrompts[Math.floor(Math.random() * mockPrompts.length)] }
          : p
      ));
    }
  };

  const handleSubmitPrompt = () => {
    if (!prompt.trim()) return;

    // Simple scoring algorithm (in a real game, this would use AI to evaluate)
    const similarity = calculateSimilarity(prompt, currentTarget);
    const score = Math.floor(similarity * 100);

    setPlayers(prev => prev.map(p => 
      p.id === "1" 
        ? { ...p, score: p.score + score, lastPrompt: prompt }
        : p
    ));

    toast({
      title: "Prompt Submitted!",
      description: `You scored ${score} points for this round!`
    });

    setPrompt("");
  };

  const calculateSimilarity = (prompt: string, target: string): number => {
    // Mock similarity calculation - in real game, this would use NLP
    const promptWords = prompt.toLowerCase().split(' ');
    const targetWords = target.toLowerCase().split(' ');
    const overlap = promptWords.filter(word => targetWords.some(t => t.includes(word) || word.includes(t)));
    return Math.min(overlap.length / targetWords.length + Math.random() * 0.3, 1);
  };

  const handleRoundEnd = () => {
    // Award bonus points to AI players
    setPlayers(prev => prev.map(p => {
      if (p.id !== "1" && p.lastPrompt) {
        return { ...p, score: p.score + Math.floor(Math.random() * 80) + 20 };
      }
      return p;
    }));

    // Start new round
    setRound(prev => prev + 1);
    setCurrentTarget(TARGET_STRINGS[Math.floor(Math.random() * TARGET_STRINGS.length)]);
    setPlayers(prev => prev.map(p => ({ ...p, lastPrompt: undefined })));
    setTimeLeft(60);

    toast({
      title: "New Round!",
      description: `Round ${round + 1} has begun!`
    });
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const progressPercentage = (timeLeft / 60) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
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
                <div className="text-2xl font-mono bg-muted/50 p-4 rounded-lg text-center">
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
                />
                <Button 
                  onClick={handleSubmitPrompt}
                  disabled={!prompt.trim() || !isGameActive}
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
            <Card className="bg-card/50 backdrop-blur-sm border-accent/20 glow-success">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      player.id === "1" ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'
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
                        <div className="font-semibold">{player.name}</div>
                        {player.lastPrompt && (
                          <div className="text-xs text-muted-foreground truncate max-w-32">
                            "{player.lastPrompt}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${index === 0 ? 'animate-score-bump' : ''}`}>
                      {player.score}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm">Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {players.filter(p => p.lastPrompt).map(player => (
                  <div key={player.id} className="text-xs p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-primary">{player.name}</div>
                    <div className="text-muted-foreground">"{player.lastPrompt}"</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;