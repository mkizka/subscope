export class AccountKind {
  private constructor(private readonly value: "member" | "tracked" | "other") {}

  static member() {
    return new AccountKind("member");
  }

  static tracked() {
    return new AccountKind("tracked");
  }

  static other() {
    return new AccountKind("other");
  }

  get isMember() {
    return this.value === "member";
  }

  get isTracked() {
    return this.value === "tracked";
  }

  get usesTap() {
    return this.value === "member";
  }

  get syncsLabels() {
    return this.value !== "other";
  }
}
