import React, { useState } from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

const GoogleCalendar = ({ selectedDate, onDateSelect, photoDates = {} }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const renderHeader = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </Box>
        <Box>
          <IconButton
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            sx={{
              color: '#667eea',
              '&:hover': { background: 'rgba(102, 126, 234, 0.1)' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            sx={{
              color: '#667eea',
              '&:hover': { background: 'rgba(102, 126, 234, 0.1)' }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  const renderDays = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1 }}>
        {days.map((day, index) => (
          <Box
            key={day}
            sx={{
              textAlign: 'center',
              py: 2,
              fontWeight: 600,
              fontSize: '0.95rem',
              color: index === 0 ? '#ef4444' : index === 6 ? '#3b82f6' : '#64748b',
            }}
          >
            {day}
          </Box>
        ))}
      </Box>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const cloneDay = day;
        const commentCount = photoDates[formattedDate] || 0;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentDay = isToday(day);
        const dayOfWeek = day.getDay();

        days.push(
          <Box
            key={day}
            onClick={() => {
              if (isCurrentMonth) {
                onDateSelect(cloneDay);
              }
            }}
            sx={{
              minHeight: '100px',
              border: '1px solid #e2e8f0',
              borderRight: i === 6 ? '1px solid #e2e8f0' : 'none',
              borderBottom: 'none',
              cursor: isCurrentMonth ? 'pointer' : 'default',
              background: isSelected
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                : isCurrentMonth
                ? '#ffffff'
                : '#f8fafc',
              position: 'relative',
              transition: 'all 0.2s ease',
              '&:hover': isCurrentMonth ? {
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                  : 'rgba(102, 126, 234, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              } : {},
            }}
          >
            <Box sx={{ p: 1.5 }}>
              <Box
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: isCurrentDay ? 700 : isSelected ? 600 : 500,
                  color: !isCurrentMonth
                    ? '#cbd5e1'
                    : dayOfWeek === 0
                    ? '#ef4444'
                    : dayOfWeek === 6
                    ? '#3b82f6'
                    : isSelected
                    ? '#667eea'
                    : '#1e293b',
                  mb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {format(day, 'd')}
                {isCurrentDay && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#667eea',
                    }}
                  />
                )}
              </Box>

              {commentCount > 0 && isCurrentMonth && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    width: 'fit-content',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  묵상 {commentCount}건
                </Box>
              )}
            </Box>
          </Box>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <Box key={day} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days}
        </Box>
      );
      days = [];
    }

    return <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>{rows}</Box>;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        background: '#ffffff',
        borderRadius: 4,
        border: '2px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </Paper>
  );
};

export default GoogleCalendar;
