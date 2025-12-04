import React, { useState, useEffect } from 'react';
import PostForm from '../components/PostForm';
import { Box, Typography, Button, CircularProgress, Alert, Grid, Card, CardContent, CardMedia, CardActions, Container } from '@mui/material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { API_URL } from '../utils/api';

const WordSharingPage = () => {
  const { isAuthenticated } = useOutletContext(); // Get isAuthenticated from context
  const navigate = useNavigate();

  const [isWriting, setIsWriting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchPosts = () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/posts`, {
      headers: {
        'x-auth-token': token,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        return response.json();
      })
      .then(data => {
        setPosts(data.data);
      })
      .catch(err => {
        console.error('Error fetching posts:', err);
        setError('게시물을 불러오는 데 실패했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [isAuthenticated]); // Refetch posts when authentication status changes

  const handleSavePost = () => {
    setIsWriting(false);
    fetchPosts(); // 새 글 저장 후 목록을 다시 불러옴
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="warning">로그인해야 이 페이지를 볼 수 있습니다.</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login')}>로그인 페이지로 이동</Button>
      </Container>
    );
  }

  if (isWriting) {
    return (
      <Box sx={{ my: 4 }}>
        <PostForm onCancel={() => setIsWriting(false)} onSave={handleSavePost} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', my: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 5,
          pb: 3,
          borderBottom: '2px solid',
          borderImage: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%) 1',
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}
        >
          📖 말씀 나눔
        </Typography>
        <Button
          variant="contained"
          onClick={() => setIsWriting(true)}
          sx={{
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.4)',
            borderRadius: 3,
            fontWeight: 600,
            '&:hover': {
              boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          ✏️ 글쓰기
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      )}

      {!loading && !error && (
        <Grid container spacing={4}>
          {posts.length > 0 ? posts.map(post => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                    borderColor: '#667eea',
                  }
                }}
              >
                {post.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`${API_URL}${post.imageUrl}`}
                    alt={post.title}
                    sx={{
                      objectFit: 'cover',
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: '#1e293b',
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.7,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {post.content}
                  </Typography>
                </CardContent>
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    bgcolor: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 4,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    🕐 {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          )) : (
            <Grid item xs={12}>
              <Alert
                severity="info"
                sx={{
                  borderRadius: 3,
                  border: '1px solid #bee3f8',
                  '& .MuiAlert-icon': {
                    color: '#667eea',
                  }
                }}
              >
                아직 게시물이 없습니다. 첫 번째 글을 작성해보세요!
              </Alert>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default WordSharingPage;
