// Phase 28: 音声認識による学習サポート - バックエンドAPI

import { D1Database } from '@cloudflare/workers-types';

// ============================================================
// 音声入力履歴の記録
// ============================================================

export async function recordVoiceInput(
  DB: D1Database,
  studentId: number,
  inputData: {
    input_type: string;
    input_context?: string;
    recognized_text: string;
    confidence_score?: number;
    language?: string;
    processed_result?: string;
    was_successful?: number;
    error_message?: string;
    audio_duration_ms?: number;
    response_time_ms?: number;
    device_type?: string;
    browser_type?: string;
  }
): Promise<number> {
  try {
    const query = `
      INSERT INTO voice_input_history (
        school_id, student_id, input_type, input_context,
        recognized_text, confidence_score, language,
        processed_result, was_successful, error_message,
        audio_duration_ms, response_time_ms,
        device_type, browser_type
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await DB.prepare(query).bind(
      studentId,
      inputData.input_type,
      inputData.input_context || null,
      inputData.recognized_text,
      inputData.confidence_score || null,
      inputData.language || 'ja-JP',
      inputData.processed_result || null,
      inputData.was_successful ?? 1,
      inputData.error_message || null,
      inputData.audio_duration_ms || null,
      inputData.response_time_ms || null,
      inputData.device_type || null,
      inputData.browser_type || null
    ).run();

    return result.meta.last_row_id || 0;
  } catch (error) {
    console.error('音声入力履歴記録エラー:', error);
    throw error;
  }
}

// ============================================================
// 音声コマンド取得
// ============================================================

export async function getVoiceCommands(
  DB: D1Database
): Promise<any[]> {
  try {
    const query = `
      SELECT 
        command_id,
        command_name,
        command_patterns,
        action_type,
        action_target,
        description,
        example_usage
      FROM voice_commands
      WHERE is_active = 1
      ORDER BY usage_count DESC
    `;

    const results = await DB.prepare(query).all();

    return results.results.map((row: any) => ({
      command_id: row.command_id,
      command_name: row.command_name,
      patterns: JSON.parse(row.command_patterns),
      action_type: row.action_type,
      action_target: row.action_target,
      description: row.description,
      example_usage: row.example_usage,
    }));
  } catch (error) {
    console.error('音声コマンド取得エラー:', error);
    throw error;
  }
}

// ============================================================
// 音声認識設定取得
// ============================================================

export async function getVoiceSettings(
  DB: D1Database,
  userId: number
): Promise<any> {
  try {
    const query = `
      SELECT *
      FROM voice_recognition_settings
      WHERE user_id = ?
    `;

    let result = await DB.prepare(query).bind(userId).first();

    // デフォルト設定を返す
    if (!result) {
      result = {
        is_enabled: 1,
        auto_start_recognition: 0,
        continuous_recognition: 0,
        recognition_language: 'ja-JP',
        voice_feedback_enabled: 1,
        voice_speed: 1.0,
        voice_pitch: 1.0,
        show_waveform: 1,
        show_transcription: 1,
      };
    }

    return result;
  } catch (error) {
    console.error('音声設定取得エラー:', error);
    throw error;
  }
}

// ============================================================
// 音声認識設定更新
// ============================================================

export async function updateVoiceSettings(
  DB: D1Database,
  userId: number,
  settings: any
): Promise<void> {
  try {
    const query = `
      INSERT INTO voice_recognition_settings (
        user_id, is_enabled, auto_start_recognition,
        continuous_recognition, recognition_language,
        voice_feedback_enabled, voice_speed, voice_pitch,
        show_waveform, show_transcription
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        is_enabled = excluded.is_enabled,
        auto_start_recognition = excluded.auto_start_recognition,
        continuous_recognition = excluded.continuous_recognition,
        recognition_language = excluded.recognition_language,
        voice_feedback_enabled = excluded.voice_feedback_enabled,
        voice_speed = excluded.voice_speed,
        voice_pitch = excluded.voice_pitch,
        show_waveform = excluded.show_waveform,
        show_transcription = excluded.show_transcription,
        updated_at = CURRENT_TIMESTAMP
    `;

    await DB.prepare(query).bind(
      userId,
      settings.is_enabled ?? 1,
      settings.auto_start_recognition ?? 0,
      settings.continuous_recognition ?? 0,
      settings.recognition_language || 'ja-JP',
      settings.voice_feedback_enabled ?? 1,
      settings.voice_speed || 1.0,
      settings.voice_pitch || 1.0,
      settings.show_waveform ?? 1,
      settings.show_transcription ?? 1
    ).run();
  } catch (error) {
    console.error('音声設定更新エラー:', error);
    throw error;
  }
}

// ============================================================
// 音声認識エラー記録
// ============================================================

export async function recordVoiceError(
  DB: D1Database,
  studentId: number,
  errorData: {
    error_type: string;
    error_code?: string;
    error_message?: string;
    browser_type?: string;
    device_type?: string;
    attempted_language?: string;
  }
): Promise<void> {
  try {
    const query = `
      INSERT INTO voice_recognition_errors (
        school_id, student_id, error_type, error_code,
        error_message, browser_type, device_type, attempted_language
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `;

    await DB.prepare(query).bind(
      studentId,
      errorData.error_type,
      errorData.error_code || null,
      errorData.error_message || null,
      errorData.browser_type || null,
      errorData.device_type || null,
      errorData.attempted_language || 'ja-JP'
    ).run();
  } catch (error) {
    console.error('音声エラー記録エラー:', error);
    throw error;
  }
}

// ============================================================
// 音声統計取得
// ============================================================

export async function getVoiceStatistics(
  DB: D1Database,
  studentId: number
): Promise<any> {
  try {
    const query = `
      SELECT *
      FROM v_voice_recognition_stats
      WHERE student_id = ?
    `;

    const result = await DB.prepare(query).bind(studentId).first();

    return result || {
      total_inputs: 0,
      successful_inputs: 0,
      avg_confidence: 0,
      avg_response_time: 0,
      active_days: 0,
    };
  } catch (error) {
    console.error('音声統計取得エラー:', error);
    throw error;
  }
}
