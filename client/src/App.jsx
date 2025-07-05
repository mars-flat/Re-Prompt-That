import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://100.26.52.167/api', { transports: ['websocket'] });

function App() {
  const [username, setUsername] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on('roomJoined', ({ roomCode }) => {
      setJoinedRoom(roomCode);
    });

    socket.on('updateUserList', (userList) => {
      setUsers(userList);
    });

    return () => {
      socket.off('roomJoined');
      socket.off('updateUserList');
    };
  }, []);

  const handleCreate = () => {
    if (!username.trim()) return alert('Enter a username');
    socket.emit('createRoom', { username });
  };

  const handleJoin = () => {
    if (!username.trim()) return alert('Enter a username');
    if (!roomCodeInput.trim()) return alert('Enter a room code');
    socket.emit('joinRoom', { roomCode: roomCodeInput.trim(), username });
  };

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Room App</h1>

      {!joinedRoom ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <label>Username: </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Room Code: </label>
            <input
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="e.g. 1234"
            />
          </div>

          <button onClick={handleCreate} style={{ marginRight: 8 }}>
            Create Room
          </button>
          <button onClick={handleJoin}>Join Room</button>
        </>
      ) : (
        <>
          <h2>Connected to Room: {joinedRoom}</h2>
          <h3>Users in this room:</h3>
          <ul>
            {users.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
