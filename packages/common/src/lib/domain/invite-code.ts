type InviteCodeParams = {
  code: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date | null;
};

export class InviteCode {
  readonly code: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  private _usedAt: Date | null;

  constructor(params: InviteCodeParams) {
    this.code = params.code;
    this.expiresAt = params.expiresAt;
    this.createdAt = params.createdAt;
    this._usedAt = params.usedAt ?? null;
  }

  static generate(publicUrl: string, daysToExpire: number): InviteCode {
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 7)
      .toLowerCase();

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

  private isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this._usedAt !== null;
  }

  canBeUsed(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  get usedAt(): Date | null {
    return this._usedAt;
  }

  markAsUsed(): void {
    if (!this.canBeUsed()) {
      throw new Error(
        "Cannot mark as used: invite code has expired or already been used",
      );
    }
    this._usedAt = new Date();
  }
}
