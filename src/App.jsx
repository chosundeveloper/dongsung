import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#818cf8', // Indigo 400
      light: '#a5b4fc',
      dark: '#6366f1',
    },
    secondary: {
      main: '#f472b6', // Pink 400
      light: '#fbcfe8',
      dark: '#db2777',
    },
    background: {
      default: '#0f172a', // Slate 900
      paper: '#1e293b', // Slate 800
    },
    text: {
      primary: '#f8fafc', // Slate 50
      secondary: '#94a3b8', // Slate 400
    },
  },
  typography: {
    fontFamily: '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
        },
      },
    },
  },
});

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      navigate('/login', { replace: true });
    }
    setIsLoading(false);
  }, [navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Typography>로딩 중...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 280, height: '100%', bgcolor: '#0f172a', color: '#fff' }}>
      <Box sx={{
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          메뉴
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List sx={{ p: 2 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={NavLink}
            to="/"
            onClick={handleNavClick}
            sx={{
              borderRadius: 3,
              '&.active': { bgcolor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            <ListItemText primary="말씀 홈" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={NavLink}
            to="/gallery"
            onClick={handleNavClick}
            sx={{
              borderRadius: 3,
              '&.active': { bgcolor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            <ListItemText primary="갤러리" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            component={NavLink}
            to="/bugs"
            onClick={handleNavClick}
            sx={{
              borderRadius: 3,
              '&.active': { bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            <ListItemText primary="버그 리포트" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <ListItemButton
            onClick={() => {
              handleLogout();
              handleNavClick();
            }}
            sx={{
              borderRadius: 3,
              color: '#ef4444',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
            }}
          >
            <ListItemText primary="로그아웃" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="sticky">
          <Toolbar sx={{ py: 1 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, color: '#94a3b8' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1.5 }}>
              <img
                src="/pck-logo.jpeg"
                alt="Logo"
                style={{
                  height: '36px',
                  width: 'auto',
                  borderRadius: '8px'
                }}
              />
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                <Button
                  component={NavLink}
                  to="/"
                  color="inherit"
                  sx={{
                    p: 0,
                    fontSize: 'inherit',
                    '&:hover': { bgcolor: 'transparent', color: '#818cf8' }
                  }}
                >
                  송탄동성교회
                </Button>
              </Typography>
            </Box>
            {!isMobile && (
              <>
                <Button
                  component={NavLink}
                  to="/"
                  color="inherit"
                  sx={{
                    mx: 0.5,
                    px: 2,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                    '&.active': { color: '#818cf8', bgcolor: 'rgba(99, 102, 241, 0.1)' }
                  }}
                >
                  말씀 홈
                </Button>
                <Button
                  component={NavLink}
                  to="/gallery"
                  color="inherit"
                  sx={{
                    mx: 0.5,
                    px: 2,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                    '&.active': { color: '#818cf8', bgcolor: 'rgba(99, 102, 241, 0.1)' }
                  }}
                >
                  갤러리
                </Button>
                <Button
                  component={NavLink}
                  to="/bugs"
                  color="inherit"
                  sx={{
                    mx: 0.5,
                    px: 2,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                    '&.active': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }
                  }}
                >
                  버그 리포트
                </Button>
                <Button
                  onClick={handleLogout}
                  color="inherit"
                  sx={{
                    mx: 0.5,
                    px: 2,
                    borderRadius: 2,
                    color: '#ef4444',
                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                  }}
                >
                  로그아웃
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { bgcolor: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.1)' } }}
        >
          {drawer}
        </Drawer>

        {/* Main Content Area - No Container wrapper to allow full-width pages */}
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>

        <Box
          component="footer"
          sx={{
            bgcolor: '#0f172a',
            p: 4,
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
            &copy; 2025 송탄동성교회 예수사명공동체. All Rights Reserved.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
