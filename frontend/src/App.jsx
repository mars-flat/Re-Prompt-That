import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('App component mounted, setting up socket listeners');

    // Connection status
    socket.on('connect', () => {
      console.log('Connected to server with socket ID:', socket.id);
      setIsConnected(true);
      setError('');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to server');
      setIsConnected(false);
    });

    // Room events
    socket.on('userJoined', (code) => {
      console.log('User joined room:', code);
      setJoinedRoom(code);
      setError('');
    });

    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('userJoined');
      socket.disconnect();
    };
  }, []);

  const handleCreate = () => {
    console.log('Creating room...');
    setError('');
    
    socket.emit('createRoom', (response) => {
      console.log('Create room response:', response);
      if (response && response.roomCode) {
        setJoinedRoom(response.roomCode);
        console.log('Successfully created room:', response.roomCode);
      } else {
        console.error('Failed to create room:', response);
        setError('Failed to create room');
      }
    });
  };

  const handleJoin = () => {
    if (!inputCode.trim()) {
      console.log('No room code entered');
      setError('Please enter a room code');
      return;
    }

    console.log('Joining room:', inputCode);
    setError('');
    
    socket.emit('joinRoom', inputCode, (response) => {
      console.log('Join room response:', response);
      if (response && response.success) {
        setJoinedRoom(inputCode);
        console.log('Successfully joined room:', inputCode);
      } else {
        const errorMsg = response?.error || 'Failed to join room';
        console.error('Failed to join room:', errorMsg);
        setError(errorMsg);
      }
    });
  };

  const handleLeaveRoom = () => {
    console.log('Leaving room:', joinedRoom);
    setJoinedRoom(null);
    setInputCode('');
    setError('');
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Room Demo</h1>
      
      {/* Connection Status */}
      <div style={{ 
        padding: '8px', 
        marginBottom: '16px',
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        color: isConnected ? '#155724' : '#721c24',
        borderRadius: '4px'
      }}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: '8px', 
          marginBottom: '16px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          Error: {error}
        </div>
      )}

      {!joinedRoom ? (
        <>
          <button 
            onClick={handleCreate}
            disabled={!isConnected}
            style={{ marginBottom: '16px' }}
          >
            Create Room
          </button>
          <br />
          <input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Enter 4-digit code"
            style={{ marginBottom: '8px', padding: '8px' }}
          />
          <br />
          <button 
            onClick={handleJoin}
            disabled={!isConnected || !inputCode.trim()}
          >
            Join Room
          </button>
        </>
      ) : (
        <div>
          <h2>Connected to: {joinedRoom}</h2>
          <button onClick={handleLeaveRoom}>
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
