/**
 * レート制限（ログイン試行制限）
 *
 * 5回失敗で5分間ロック（IPアドレスベース）
 */

interface LoginAttempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttempt>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5分
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15分

function cleanupOldEntries(): void {
  const now = Date.now();
  for (const [key, attempt] of loginAttempts.entries()) {
    if (
      (!attempt.lockedUntil || attempt.lockedUntil < now) &&
      now - attempt.firstAttemptAt > ATTEMPT_WINDOW_MS
    ) {
      loginAttempts.delete(key);
    }
  }
}

export function checkLoginAttempt(identifier: string): {
  isLocked: boolean;
  remainingAttempts: number;
  lockExpiresIn: number | null;
} {
  if (Math.random() < 0.1) {
    cleanupOldEntries();
  }

  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockExpiresIn: null };
  }

  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockExpiresIn: Math.ceil((attempt.lockedUntil - now) / 1000),
    };
  }

  if (attempt.lockedUntil && attempt.lockedUntil <= now) {
    loginAttempts.delete(identifier);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockExpiresIn: null };
  }

  if (now - attempt.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockExpiresIn: null };
  }

  return {
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempt.count),
    lockExpiresIn: null,
  };
}

export function recordLoginFailure(identifier: string): {
  isLocked: boolean;
  remainingAttempts: number;
  lockExpiresIn: number | null;
} {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    });
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - 1, lockExpiresIn: null };
  }

  attempt.count += 1;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCK_DURATION_MS;
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockExpiresIn: Math.ceil(LOCK_DURATION_MS / 1000),
    };
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_ATTEMPTS - attempt.count,
    lockExpiresIn: null,
  };
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}
