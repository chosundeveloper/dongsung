import React from 'react';
import { Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import PostForm from '../components/PostForm';

const WritePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 달력에서 전달받은 날짜 또는 오늘 날짜 사용
  const selectedDate = location.state?.selectedDate || new Date();

  const handleCancel = () => {
    navigate('/');
  };

  const handleSave = () => {
    navigate('/');
  };

  return (
    <Box sx={{ my: 4 }}>
      <PostForm
        onCancel={handleCancel}
        onSave={handleSave}
        initialDate={selectedDate}
      />
    </Box>
  );
};

export default WritePage;
