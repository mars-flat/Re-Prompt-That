import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://100.26.52.167:4000', {
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
    });

    socket.on('error', (error) => {
      setErrorMessage(error);
      setIsLoading(false);
    });

    socket.on('chatResponse', ({message}) => {
        setGptResponse(message);
        console.log(message);
    });

    socket.on('timerMessage', ({timer}) => {
        setTimer(timer);
    })

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('roomJoined');
      socket.off('updateUserList');
      socket.off('error');
    };
  }, []);

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
    socket.emit('sendMessage', { message: userInput });
  }

  const handleChange = (event) => {
    setUserInput(event.target.value); // updates state on every keystroke
  };

  const startGame = () => {
    socket.emit('startGame', { roomCode: joinedRoom });
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
              <li key={i}>{u}</li>
            ))}
          </ul>
          
          <button 
            onClick={() => {
              setJoinedRoom(null);
              setUsers([]);
              setErrorMessage('');
            }}
            style={{ marginTop: '16px' }}
          >
            Leave Room
          </button>
        </>
      )}

    
    </div>
  );
}

export default App;
