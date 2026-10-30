import { randomInt } from "node:crypto";
export class InviteCode {
  code;
  expiresAt;
  createdAt;
  _usedAt;
  constructor(params) {
    this.code = params.code;
    this.expiresAt = params.expiresAt;
    this.createdAt = params.createdAt;
    this._usedAt = params.usedAt ?? null;
  }
  static generate(publicUrl, daysToExpire) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const randomSuffix = Array.from(
      { length: 5 },
      () => chars[randomInt(chars.length)],
    ).join("");
    const domain = new URL(publicUrl).hostname;
    const domainKebab = domain.replace(/\./g, "-");
    const code = `${domainKebab}-${randomSuffix}`;
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + daysToExpire * 24 * 60 * 60 * 1000,
    );
    return new InviteCode({
      code,
      expiresAt,
      createdAt: now,
    });
  }
  isExpired() {
    return new Date() > this.expiresAt;
  }
  isUsed() {
    return this._usedAt !== null;
  }
  canBeUsed() {
    return !this.isExpired() && !this.isUsed();
  }
  get usedAt() {
    return this._usedAt;
  }
  markAsUsed() {
    if (!this.canBeUsed()) {
      throw new Error(
        "Cannot mark as used: invite code has expired or already been used",
      );
    }
    this._usedAt = new Date();
  }
}
