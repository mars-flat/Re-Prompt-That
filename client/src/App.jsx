import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling']
});

function App() {
  const [username, setUsername] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [gptResponse, setGptResponse] = useState('');
  const [userInput, setUserInput] = useState('');
  
  // Score calculation state
  const [string1, setString1] = useState('');
  const [string2, setString2] = useState('');
  const [calculatedScore, setCalculatedScore] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gamePrompt, setGamePrompt] = useState('');
  const [lastScore, setLastScore] = useState(null);
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalRankings, setFinalRankings] = useState(null);
  const [lastAiResponse, setLastAiResponse] = useState('');
  const [userScores, setUserScores] = useState({});

  useEffect(() => {
    // Connection status handlers
    socket.on('connect', () => {
      setConnectionStatus('Connected');
      setErrorMessage('');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected');
      setErrorMessage('Lost connection to server');
    });

    socket.on('connect_error', (error) => {
      setConnectionStatus('Connection Failed');
      setErrorMessage(`Failed to connect: ${error.message}`);
    });

    // Room handlers
    socket.on('roomJoined', ({ roomCode }) => {
      setJoinedRoom(roomCode);
      setIsLoading(false);
      setErrorMessage('');
    });

    socket.on('updateUserList', (userList) => {
      setUsers(userList);
      // Initialize scores for new users
      const newScores = {};
      userList.forEach(user => {
        if (!userScores[user]) {
          newScores[user] = 0;
        } else {
          newScores[user] = userScores[user];
        }
      });
      setUserScores(prev => ({ ...prev, ...newScores }));
    });

    socket.on('error', (error) => {
      setErrorMessage(error.message || error);
      setIsLoading(false);
    });

    socket.on('chatResponse', ({message}) => {
        setGptResponse(message);
        console.log(message);
    });

    socket.on('timerMessage', ({timer}) => {
        setTimer(timer);
    })

    socket.on('gameStarted', ({currentQuestion}) => {
        setCurrentQuestion(currentQuestion);
        setIsGameActive(true);
        setGameEnded(false);
        setFinalRankings(null);
        setLeaderboard([]);
        setLastScore(null);
        setLastAiResponse('');
        // Reset all user scores when game starts
        const resetScores = {};
        users.forEach(user => {
          resetScores[user] = 0;
        });
        setUserScores(resetScores);
        console.log('Game started with question:', currentQuestion);
    })

    socket.on('scoreCalculated', ({score}) => {
        setCalculatedScore(score);
        setIsCalculating(false);
    })

    // New game-related socket events
    socket.on('promptScored', ({score, leaderboard, aiResponse, userPrompt}) => {
        setLastScore(score);
        setLeaderboard(leaderboard);
        setLastAiResponse(aiResponse);
        setIsSubmittingPrompt(false);
        setGamePrompt('');
        
        // Update user scores from leaderboard
        const newScores = {};
        leaderboard.forEach(player => {
          newScores[player.username] = player.score;
        });
        setUserScores(prev => ({ ...prev, ...newScores }));
    });

    socket.on('updateLeaderboard', ({leaderboard, playerScore, username}) => {
        setLeaderboard(leaderboard);
        
        // Update user scores from leaderboard
        const newScores = {};
        leaderboard.forEach(player => {
          newScores[player.username] = player.score;
        });
        setUserScores(prev => ({ ...prev, ...newScores }));
    });

    socket.on('gameEnded', ({rankings, winner}) => {
        setIsGameActive(false);
        setGameEnded(true);
        setFinalRankings(rankings);
        setTimer(0);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('roomJoined');
      socket.off('updateUserList');
      socket.off('error');
      socket.off('chatResponse');
      socket.off('timerMessage');
      socket.off('gameStarted');
      socket.off('scoreCalculated');
      socket.off('promptScored');
      socket.off('updateLeaderboard');
      socket.off('gameEnded');
    };
  }, [users, userScores]);

  const handleCreate = () => {
    if (!username.trim()) {
      setErrorMessage('Enter a username');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    socket.emit('createRoom', { username });
  };

  const handleJoin = () => {
    if (!username.trim()) {
      setErrorMessage('Enter a username');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMessage('Enter a room code');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    socket.emit('joinRoom', { roomCode: roomCodeInput.trim(), username });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return '#4CAF50';
      case 'Connecting...': return '#FF9800';
      case 'Disconnected': return '#F44336';
      case 'Connection Failed': return '#F44336';
      default: return '#757575';
    }
  };

  const handleGPT = () => {
    socket.emit('sendMessage', { roomCode: joinedRoom, username, message: userInput });
  }

  const handleChange = (event) => {
    setUserInput(event.target.value); // updates state on every keystroke
  };

  const startGame = () => {
    socket.emit('startGame', { roomCode: joinedRoom });
  };

  const handleCalculateScore = () => {
    if (!string1.trim() || !string2.trim()) {
      setErrorMessage('Please enter both strings');
      return;
    }
    setIsCalculating(true);
    setCalculatedScore(null);
    setErrorMessage('');
    socket.emit('calculateScore', { string1: string1.trim(), string2: string2.trim() });
  };

  const handleSubmitGamePrompt = () => {
    if (!gamePrompt.trim()) {
      setErrorMessage('Please enter a prompt');
      return;
    }
    setIsSubmittingPrompt(true);
    setErrorMessage('');
    socket.emit('submitPrompt', { 
      roomCode: joinedRoom, 
      username, 
      prompt: gamePrompt.trim() 
    });
  };

  const resetGame = () => {
    setGameEnded(false);
    setFinalRankings(null);
    setLeaderboard([]);
    setLastScore(null);
    setCurrentQuestion(null);
    setIsGameActive(false);
    setTimer(0);
  };

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Room App</h1>
    
    <input type="text" value={userInput} onChange={handleChange} />
      
    <button onClick={handleGPT}>Submit</button>
    <p>
        Response: {gptResponse}
    </p>
    <h1>
        Timer: {timer}
    </h1>
    <button onClick={startGame}>Start Game</button>
      
      {/* Connection Status */}
      <div style={{ 
        padding: '8px 12px', 
        backgroundColor: getStatusColor(), 
        color: 'white', 
        borderRadius: '4px',
        marginBottom: '16px',
        display: 'inline-block'
      }}>
        Status: {connectionStatus}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#F44336', 
          color: 'white', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          Error: {errorMessage}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#2196F3', 
          color: 'white', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          ⏳ {joinedRoom ? 'Joining room...' : 'Creating room...'}
        </div>
      )}

      {!joinedRoom ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <label>Username: </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={connectionStatus !== 'Connected'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Room Code: </label>
            <input
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="e.g. 1234"
              disabled={connectionStatus !== 'Connected'}
            />
          </div>

          <button 
            onClick={handleCreate} 
            style={{ marginRight: 8 }}
            disabled={connectionStatus !== 'Connected' || isLoading}
          >
            Create Room
          </button>
          <button 
            onClick={handleJoin}
            disabled={connectionStatus !== 'Connected' || isLoading}
          >
            Join Room
          </button>
        </>
      ) : (
        <>
          <h2>Connected to Room: {joinedRoom}</h2>
          <h3>Users in this room ({users.length}):</h3>
          <ul>
            {users.map((u, i) => (
              <li key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                borderBottom: i < users.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <span>{u}</span>
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  Score: {userScores[u] || 0}
                </span>
              </li>
            ))}
          </ul>
          
          {/* Start Game Button - only show when not in active game */}
          {!isGameActive && !gameEnded && (
            <button 
              onClick={startGame}
              disabled={users.length === 0}
              style={{ 
                marginTop: '16px',
                padding: '12px 24px',
                backgroundColor: users.length > 0 ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: users.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Start Game ({users.length} players)
            </button>
          )}

          {/* Game Interface */}
          {isGameActive && currentQuestion && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#e3f2fd',
              border: '2px solid #2196f3',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>
                🎯 Current Question:
              </h3>
              <p style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#1565c0'
              }}>
                {currentQuestion}
              </p>

              {/* Timer */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#d32f2f' }}>
                  ⏰ Time Remaining: {timer}s
                </h4>
              </div>

              {/* Game Prompt Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Your Prompt:
                </label>
                <textarea
                  value={gamePrompt}
                  onChange={(e) => setGamePrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}
                  disabled={isSubmittingPrompt}
                />
                <button
                  onClick={handleSubmitGamePrompt}
                  disabled={isSubmittingPrompt || !gamePrompt.trim()}
                  style={{
                    marginTop: '8px',
                    padding: '8px 16px',
                    backgroundColor: isSubmittingPrompt ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSubmittingPrompt ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingPrompt ? 'Submitting...' : 'Submit Prompt'}
                </button>
              </div>

              {/* Last Score Display */}
              {lastScore !== null && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#e8f5e8',
                  border: '1px solid #4CAF50',
                  borderRadius: '4px',
                  marginBottom: '16px'
                }}>
                  <p style={{ margin: '0', color: '#2e7d32', fontWeight: 'bold' }}>
                    Your Score: {lastScore}
                  </p>
                </div>
              )}

              {/* AI Response Display */}
              {lastAiResponse && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f3e5f5',
                  border: '1px solid #9c27b0',
                  borderRadius: '4px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#7b1fa2' }}>
                    🤖 AI Response:
                  </h4>
                  <p style={{ 
                    margin: '0', 
                    color: '#4a148c',
                    fontStyle: 'italic',
                    fontSize: '14px'
                  }}>
                    {lastAiResponse}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 12px 0' }}>🏆 Leaderboard</h3>
              {leaderboard.map((player, index) => (
                <div key={player.username} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: index < leaderboard.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                    {index + 1}. {player.username}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{player.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Game End Results */}
          {gameEnded && finalRankings && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#fff3e0',
              border: '2px solid #ff9800',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#e65100' }}>
                🎉 Game Over!
              </h3>
              <h4 style={{ margin: '0 0 8px 0', color: '#f57c00' }}>
                Final Rankings:
              </h4>
              {finalRankings.map((player, index) => (
                <div key={player.username} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: index < finalRankings.length - 1 ? '1px solid #ffe0b2' : 'none'
                }}>
                  <span style={{ 
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    color: index === 0 ? '#e65100' : 'inherit'
                  }}>
                    {index + 1}. {player.username}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{player.score}</span>
                </div>
              ))}
              <button
                onClick={resetGame}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Play Again
              </button>
            </div>
          )}
          
          <button 
            onClick={() => {
              setJoinedRoom(null);
              setUsers([]);
              setErrorMessage('');
              setCurrentQuestion(null);
              setIsGameActive(false);
              setGameEnded(false);
              setFinalRankings(null);
              setLeaderboard([]);
              setLastScore(null);
              setTimer(0);
            }}
            style={{ marginTop: '16px' }}
          >
            Leave Room
          </button>
        </>
      )}

      {/* Score Calculation Section */}
      <div style={{ 
        marginTop: '32px', 
        padding: '24px', 
        border: '2px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2>String Similarity Calculator</h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Enter two strings to calculate their similarity score using vector similarity.
        </p>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            String 1:
          </label>
          <textarea
            value={string1}
            onChange={(e) => setString1(e.target.value)}
            placeholder="Enter first string..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            String 2:
          </label>
          <textarea
            value={string2}
            onChange={(e) => setString2(e.target.value)}
            placeholder="Enter second string..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <button
          onClick={handleCalculateScore}
          disabled={isCalculating || !string1.trim() || !string2.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isCalculating ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCalculating ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Similarity Score'}
        </button>

        {calculatedScore !== null && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#e8f5e8',
            border: '1px solid #4CAF50',
            borderRadius: '4px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>
              Similarity Score: {calculatedScore.toFixed(4)}
            </h3>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              Score range: 0.0 (completely different) to 1.0 (identical)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
