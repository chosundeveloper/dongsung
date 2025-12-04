import React, { useRef, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Stack,
  Collapse,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import { format } from 'date-fns';

const ChatWidget = ({ appName = 'dongsung' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Get or create user name from localStorage
  useEffect(() => {
    let storedUserName = localStorage.getItem('chatUserName');
    if (!storedUserName) {
      storedUserName = `User${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('chatUserName', storedUserName);
    }
    setUserName(storedUserName);
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!userName) return;

    const MESSENGER_URL = process.env.REACT_APP_MESSENGER_URL || 'https://messenger.chosundev.duckdns.org';

    socketRef.current = io(MESSENGER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      // Join the app-specific channel
      socketRef.current.emit('join channel', {
        appName,
        userName,
      });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('load messages', (data) => {
      setMessages(data.messages || []);
    });

    socketRef.current.on('new message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userName, appName]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    setIsLoading(true);
    const message = {
      appName,
      userName,
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('send message', message, () => {
      setInputValue('');
      setIsLoading(false);
    });
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: isMobile ? 10 : 20, zIndex: 999 }}>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: '#818cf8',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(129, 140, 248, 0.4)',
            '&:hover': {
              bgcolor: '#6366f1',
              boxShadow: '0 6px 16px rgba(129, 140, 248, 0.6)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <ChatIcon />
        </IconButton>
      )}

      {/* Chat Widget Window */}
      <Collapse in={isOpen} sx={{ position: 'absolute', bottom: 0, right: 0 }}>
        <Paper
          sx={{
            width: isMobile ? 'calc(100vw - 40px)' : 360,
            maxHeight: isMobile ? 'calc(100vh - 100px)' : 500,
            borderRadius: 3,
            bgcolor: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(129, 140, 248, 0.15)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ChatIcon sx={{ color: '#818cf8', fontSize: 20 }} />
              <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                {appName} 피드백
              </Typography>
              <Chip
                label={isConnected ? '연결됨' : '연결 중...'}
                size="small"
                sx={{
                  bgcolor: isConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: isConnected ? '#22c55e' : '#ef4444',
                  fontSize: '0.75rem',
                }}
              />
            </Stack>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{ color: '#94a3b8' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              bgcolor: '#0f172a',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                },
              },
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  아직 메시지가 없습니다.
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  첫 번째 피드백을 남겨보세요!
                </Typography>
              </Box>
            ) : (
              messages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.userName === userName ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Stack
                    direction={msg.userName === userName ? 'row-reverse' : 'row'}
                    spacing={0.5}
                    alignItems="flex-end"
                    sx={{ maxWidth: '85%' }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: msg.userName === userName ? '#818cf8' : '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {msg.userName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Box
                        sx={{
                          bgcolor:
                            msg.userName === userName
                              ? 'rgba(129, 140, 248, 0.3)'
                              : 'rgba(71, 85, 105, 0.3)',
                          color: '#e2e8f0',
                          p: '8px 12px',
                          borderRadius: '12px',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          fontSize: '0.85rem',
                          lineHeight: 1.4,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.25, fontWeight: 500 }}>
                          {msg.userName}
                        </Typography>
                        {msg.content}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#64748b',
                          fontSize: '0.7rem',
                          mt: 0.25,
                          display: 'block',
                          textAlign: msg.userName === userName ? 'right' : 'left',
                        }}
                      >
                        {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              p: 1.5,
              bgcolor: '#1e293b',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: 1,
            }}
          >
            <TextField
              size="small"
              placeholder="피드백 입력..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!isConnected || isLoading}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#818cf8', borderWidth: 1 },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#64748b',
                  opacity: 0.7,
                },
              }}
            />
            <IconButton
              type="submit"
              disabled={!isConnected || !inputValue.trim() || isLoading}
              sx={{
                color: '#818cf8',
                '&:disabled': { color: '#475569' },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default ChatWidget;
