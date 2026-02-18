/**
 * レート制限（ログイン試行制限）
 *
 * 5回失敗で5分間ロック（IPアドレスベース）
 * Supabaseテーブルに永続化（Vercelサーバーレス環境対応）
 */

import { createServiceClient } from '@/lib/supabase/server';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5分
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15分

export async function checkLoginAttempt(identifier: string): Promise<{
  isLocked: boolean;
  remainingAttempts: number;
  lockExpiresIn: number | null;
}> {
  const supabase = createServiceClient();
  const now = new Date();

  const { data: attempt } = await supabase
    .from('login_attempts')
    .select('attempt_count, first_attempt_at, locked_until')
    .eq('identifier', identifier)
    .single();

  if (!attempt) {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockExpiresIn: null };
  }

  // ロック中の場合
  if (attempt.locked_until) {
    const lockedUntil = new Date(attempt.locked_until);
    if (lockedUntil > now) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockExpiresIn: Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000),
      };
    }
    // ロック期限切れ → リセット
    await supabase.from('login_attempts').delete().eq('identifier', identifier);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockExpiresIn: null };
  }

  // 試行ウィンドウ超過 → リセット
  const firstAttempt = new Date(attempt.first_attempt_at);
  if (now.getTime() - firstAttempt.getTime() > ATTEMPT_WINDOW_MS) {
    await supabase.from('login_attempts').delete().eq('identifier', identifier);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS, lockExpiresIn: null };
  }

  return {
    isLocked: false,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempt.attempt_count),
    lockExpiresIn: null,
  };
}

export async function recordLoginFailure(identifier: string): Promise<{
  isLocked: boolean;
  remainingAttempts: number;
  lockExpiresIn: number | null;
}> {
  const supabase = createServiceClient();
  const now = new Date();

  const { data: attempt } = await supabase
    .from('login_attempts')
    .select('attempt_count, first_attempt_at')
    .eq('identifier', identifier)
    .single();

  if (!attempt) {
    // 初回失敗
    await supabase.from('login_attempts').insert({
      identifier,
      attempt_count: 1,
      first_attempt_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - 1, lockExpiresIn: null };
  }

  // 試行ウィンドウ超過 → リセットして1からカウント
  const firstAttempt = new Date(attempt.first_attempt_at);
  if (now.getTime() - firstAttempt.getTime() > ATTEMPT_WINDOW_MS) {
    await supabase
      .from('login_attempts')
      .update({
        attempt_count: 1,
        first_attempt_at: now.toISOString(),
        locked_until: null,
        updated_at: now.toISOString(),
      })
      .eq('identifier', identifier);
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS - 1, lockExpiresIn: null };
  }

  const newCount = attempt.attempt_count + 1;

  if (newCount >= MAX_ATTEMPTS) {
    // ロック
    const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
    await supabase
      .from('login_attempts')
      .update({
        attempt_count: newCount,
        locked_until: lockedUntil.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('identifier', identifier);
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockExpiresIn: Math.ceil(LOCK_DURATION_MS / 1000),
    };
  }

  // カウントアップ
  await supabase
    .from('login_attempts')
    .update({
      attempt_count: newCount,
      updated_at: now.toISOString(),
    })
    .eq('identifier', identifier);

  return {
    isLocked: false,
    remainingAttempts: MAX_ATTEMPTS - newCount,
    lockExpiresIn: null,
  };
}

export async function resetLoginAttempts(identifier: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('login_attempts').delete().eq('identifier', identifier);
}
