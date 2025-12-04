import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/api';

const ForgotPasswordPage = () => {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '비밀번호 재설정에 실패했습니다.');
      }

      setSuccess(true);
      setUsername('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          position: 'relative',
          p: 5,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          align="center"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          🔑 비밀번호 찾기
        </Typography>
        <Typography
          variant="body2"
          align="center"
          sx={{
            mb: 4,
            color: '#64748b',
            fontWeight: 500,
          }}
        >
          사용자 이름을 입력하고 새 비밀번호를 설정하세요
        </Typography>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 3,
              border: '1px solid #feb2b2',
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 3,
              border: '1px solid #9ae6b4',
            }}
          >
            비밀번호가 성공적으로 재설정되었습니다! 로그인 페이지로 이동합니다.
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="사용자 이름"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              }
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="새 비밀번호"
            type="password"
            id="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              }
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="비밀번호 확인"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 4,
              mb: 2,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
              borderRadius: 3,
              fontWeight: 700,
              fontSize: '1rem',
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            비밀번호 재설정
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
            sx={{
              py: 1.5,
              color: '#667eea',
              fontWeight: 600,
              borderRadius: 3,
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.08)',
              }
            }}
          >
            로그인으로 돌아가기
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
