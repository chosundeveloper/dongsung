import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.clear?.();
  });

  it('should render login form with all fields', () => {
    renderLoginPage();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    expect(textInputs.length).toBeGreaterThan(0); // 사용자 이름 필드
    expect(passwordInputs.length).toBeGreaterThan(0); // 비밀번호 필드
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();

    // Check for secondary buttons
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 찾기' })).toBeInTheDocument();
  });

  it('should disable login button when username or password is empty', () => {
    renderLoginPage();

    const loginButton = screen.getByRole('button', { name: '로그인' });
    expect(loginButton).toBeDisabled();
  });

  it('should enable login button when both username and password are filled', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'testuser');
    await user.type(passwordInputs[0], 'password123');

    const loginButton = screen.getByRole('button', { name: '로그인' });
    expect(loginButton).not.toBeDisabled();
  });

  it('should successfully login with valid credentials', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-token-123' }),
    });

    renderLoginPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'testuser');
    await user.type(passwordInputs[0], 'password123');

    const loginButton = screen.getByRole('button', { name: '로그인' });
    await user.click(loginButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token-123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on login failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '사용자명 또는 비밀번호가 잘못되었습니다.' }),
    });

    renderLoginPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'wronguser');
    await user.type(passwordInputs[0], 'wrongpassword');

    const loginButton = screen.getByRole('button', { name: '로그인' });
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('사용자명 또는 비밀번호가 잘못되었습니다.')).toBeInTheDocument();
    });
  });

  it('should display error when fetch fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    renderLoginPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'testuser');
    await user.type(passwordInputs[0], 'password123');

    const loginButton = screen.getByRole('button', { name: '로그인' });
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should navigate to register page when register button is clicked', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    const registerButton = screen.getByRole('button', { name: '회원가입' });
    await user.click(registerButton);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('should navigate to forgot password page when clicked', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    const forgotPasswordButton = screen.getByRole('button', { name: '비밀번호 찾기' });
    await user.click(forgotPasswordButton);

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('should disable login button during loading', async () => {
    global.fetch.mockImplementation(() => new Promise(() => { })); // Never resolves

    renderLoginPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'testuser');
    await user.type(passwordInputs[0], 'password123');

    const loginButton = screen.getByRole('button', { name: '로그인' });
    await user.click(loginButton);

    expect(loginButton).toBeDisabled();
  });
});
