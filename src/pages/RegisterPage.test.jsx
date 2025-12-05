import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render registration form with all fields', () => {
    renderRegisterPage();

    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    expect(textInputs.length).toBeGreaterThan(0); // 사용자 이름 필드
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2); // 비밀번호, 비밀번호 확인

    // Check for navigation buttons
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 찾기' })).toBeInTheDocument();
  });

  it('should display error when passwords do not match', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'testuser');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password456');

    const submitButton = screen.getByRole('button', { name: '회원가입' });
    await user.click(submitButton);

    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
  });

  it('should successfully register user with matching passwords', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registration successful' }),
    });

    renderRegisterPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'testuser');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByRole('button', { name: '회원가입' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('회원가입이 성공적으로 완료되었습니다! 로그인 페이지로 이동합니다.')).toBeInTheDocument();
    });
  });

  it('should display error from server response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '이미 존재하는 사용자입니다.' }),
    });

    renderRegisterPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'existinguser');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByRole('button', { name: '회원가입' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('이미 존재하는 사용자입니다.')).toBeInTheDocument();
    });
  });

  it('should navigate to login page when login button is clicked', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    const loginButton = screen.getByRole('button', { name: '로그인' });
    await user.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should navigate to forgot password page when clicked', async () => {
    renderRegisterPage();
    const user = userEvent.setup();

    const forgotPasswordButton = screen.getByRole('button', { name: '비밀번호 찾기' });
    await user.click(forgotPasswordButton);

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('should clear form after successful registration', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registration successful' }),
    });

    renderRegisterPage();
    const user = userEvent.setup();

    const textInputs = document.querySelectorAll('input[type="text"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    await user.type(textInputs[0], 'testuser');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'password123');

    const submitButton = screen.getByRole('button', { name: '회원가입' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(textInputs[0].value).toBe('');
      expect(passwordInputs[0].value).toBe('');
      expect(passwordInputs[1].value).toBe('');
    });
  });
});
