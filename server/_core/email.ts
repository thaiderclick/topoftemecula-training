import { Resend } from "resend";
import { ENV } from "./env";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!ENV.resendApiKey) return null;
  if (!_resend) _resend = new Resend(ENV.resendApiKey);
  return _resend;
}

/**
 * Send a completion alert email when a trainee passes the final test.
 * Silently skips if RESEND_API_KEY or NOTIFICATION_EMAIL is not configured.
 */
export async function sendCompletionAlert({
  traineeName,
  traineeId,
  score,
}: {
  traineeName: string;
  traineeId: string;
  score: number;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !ENV.notificationEmail) return;

  const completedAt = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "full",
    timeStyle: "short",
  });

  await resend.emails.send({
    from: "Top of Temecula Training <training@topoftemecula.com>",
    to: ENV.notificationEmail,
    subject: `🎉 Ambassador Cleared: ${traineeName}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #faf8f4; border-radius: 12px;">
        <img src="https://topoftemecula.com/_next/image?url=%2Fimages%2Flogo-dark.png&w=384&q=75" alt="Top of Temecula" style="height: 40px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; color: #1a1a1a; margin-bottom: 8px;">Ambassador Training Cleared</h1>
        <p style="color: #555; font-size: 16px; margin-bottom: 24px;">A trainee has successfully completed all training requirements and is cleared for field operations.</p>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e0d8;">
          <tr style="background: #f0ebe3;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px; width: 40%;">TRAINEE</td>
            <td style="padding: 12px 16px; color: #1a1a1a; font-size: 15px;">${traineeName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px;">FINAL TEST SCORE</td>
            <td style="padding: 12px 16px; color: #16a34a; font-size: 15px; font-weight: bold;">${score}/10 — PASS</td>
          </tr>
          <tr style="background: #f0ebe3;">
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px;">COMPLETED</td>
            <td style="padding: 12px 16px; color: #1a1a1a; font-size: 15px;">${completedAt} PT</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-weight: bold; color: #555; font-size: 13px;">TRAINEE ID</td>
            <td style="padding: 12px 16px; color: #888; font-size: 13px; font-family: monospace;">${traineeId}</td>
          </tr>
        </table>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">View full progress and submitted assignments in the <a href="https://topoftemecula-training.com/admin" style="color: #c9961a;">Supervisor Dashboard</a>.</p>
      </div>
    `,
  });
}
