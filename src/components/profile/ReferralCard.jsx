import { useState } from "react";

function buildReferralLink(code) {
  if (!code) return "";
  return `https://astrocards.ru/?ref=${encodeURIComponent(code)}`;
}

export default function ReferralCard({ referralCode = null, invitedCount = 0, qualifiedCount = 0, rewardsCount = 0, freeAnalysisBalance = 0 }) {
  const [copied, setCopied] = useState(false);
  const link = buildReferralLink(referralCode);

  const copyLink = async () => {
    if (!link || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const shareLink = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AstroGuide", text: "Попробуй AstroGuide", url: link });
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  };

  return (
    <section className="profile-section referral-card">
      <div className="referral-card__heading">
        <div>
          <span className="eyebrow">ASTROGUIDE FRIENDS</span>
          <h2>🎁 Пригласи друзей</h2>
        </div>
        <span className="referral-card__icon" aria-hidden="true">↗</span>
      </div>
      <p className="referral-card__intro">Друг получит бесплатный разбор, а после его использования тебе начислится ещё один.</p>
      {link ? (
        <div className="referral-card__link-row">
          <code>{link}</code>
          <button type="button" className="profile-chart-card__open" onClick={copyLink}>{copied ? "Скопировано" : "Скопировать"}</button>
        </div>
      ) : (
        <div className="referral-card__pending">
          <strong>Реферальная ссылка готовится</strong>
          <span>Она появится после подключения серверной части программы. Мы не создаём ссылку локально, чтобы не потерять привязку и защиту от повторных приглашений.</span>
        </div>
      )}
      <div className="referral-card__stats" aria-label="Статистика приглашений">
        <div><strong>{invitedCount}</strong><span>приглашено</span></div>
        <div><strong>{qualifiedCount}</strong><span>квалифицировано</span></div>
        <div><strong>{rewardsCount}</strong><span>бонусов доступно</span></div>
      </div>
      <p className="referral-card__balance">Бесплатных разборов: <strong>{freeAnalysisBalance}</strong></p>
      <button type="button" className="app-button app-button--secondary referral-card__share" onClick={shareLink} disabled={!link}>
        {link ? "Пригласить друга" : "Скоро будет доступно"}
      </button>
      <small className="referral-card__note">Бонус начисляется только после того, как приглашённый действительно использует бесплатный разбор.</small>
    </section>
  );
}
