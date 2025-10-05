type InviteCodeParams = {
  code: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
};

export class InviteCode {
  readonly code: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly createdAt: Date;

  constructor(params: InviteCodeParams) {
    this.code = params.code;
    this.expiresAt = params.expiresAt;
    this.usedAt = params.usedAt ?? null;
    this.createdAt = params.createdAt;
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

  private isUsed(): boolean {
    return this.usedAt !== null;
  }

  canBeUsed(): boolean {
    return !this.isExpired() && !this.isUsed();
  }
}
