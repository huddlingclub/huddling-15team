export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** 휴대폰 기본 공유(Web Share API) → 미지원 시 클립보드 복사 */
export async function shareText(title: string, text: string): Promise<ShareOutcome> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title, text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // 공유 실패 시 복사로 대체
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok ? 'copied' : 'failed';
    } catch {
      return 'failed';
    }
  }
}
