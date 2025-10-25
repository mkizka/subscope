/**
 * PostgreSQLでは西暦0年がエラーになったり日付の範囲があるため、簡単にサニタイズする
 */
export function sanitizeDate(date: Date): Date {
  // Invalid Dateのチェック
  if (isNaN(date.getTime())) {
    return new Date(0);
  }

  if (date < new Date(0)) {
    return new Date(0);
  }

  // 時刻は9999年までしか扱わない
  const year = date.getUTCFullYear();
  if (year > 9999) {
    return new Date("9999-12-31T23:59:59.999Z");
  }

  return date;
}
