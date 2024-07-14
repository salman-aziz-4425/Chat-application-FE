'use client';

import * as React from 'react';
import io from 'socket.io-client';
import ChatLayout from '../../components/chat/chat-layout';
import { useAuth } from '@/service/auth.service';
import ProtectedRoute from '@/components/Auth/ProtectedRoutes';
import useBoundStore from '@/store/user/store';
import api from '@/lib/ky';

type User = {
  id: number;
  email: string;
};

const Chat = () => {
  const socket: any = React.useRef();
  const { logout } = useAuth();
  const { email: currentUserEmail, setActiveUsers } = useBoundStore((state) => state);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log("render")
    socket.current = io('http://localhost:5000');
    socket.current.emit('user_online', { email: currentUserEmail });
    void fetchChatUsers();
    return () => {
      socket.current.off("user_online")
      socket.current.emit("user_offline", { email: currentUserEmail });
      socket.current.disconnect();
    }
  }, []);

  const handleLogout = () => {
    if (currentUserEmail) {
      socket.current.emit("user_offline", { email: currentUserEmail });
    }
    socket.current.disconnect();
    logout();
  };

  const fetchChatUsers = async () => {
    try {
      const response = await api.get('user/allUsers');
      if (response.ok) {
        const data: User[] = await response.json();
        setActiveUsers(data.filter((user) => user.email !== currentUserEmail).map((user) => ({ ...user, online: false })));
      } else {
        throw new Error('Failed to fetch chat users');
      }
    } catch (error) {
      console.error('Error fetching chat users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className='bg-gradient-to-r h-screen from-green-900 to-black'>
        <div className='flex flex-col h-screen px-4 lg:px-0 w-full justify-center items-center py-20'>
          <div className='z-10 rounded-lg max-w-5xl w-full h-full text-sm lg:flex bg-white'>
            {loading ? (
              <div className='flex items-center justify-center h-full w-full'>
                <p>Loading...</p>
              </div>
            ) : (
              <ChatLayout socket={socket.current} />
            )}
          </div>
          <button
            onClick={handleLogout}
            className='mt-4 px-4 py-2 bg-black text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50'
          >
            Logout
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Chat;
