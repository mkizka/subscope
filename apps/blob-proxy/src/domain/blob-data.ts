export class BlobData {
  constructor(
    public readonly data: Uint8Array,
    public readonly contentType: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.data.length === 0) {
      throw new InvalidBlobDataError("Blob data cannot be empty");
    }
    if (!this.contentType) {
      throw new InvalidBlobDataError("Content type is required");
    }
  }

  static createJpeg(data: Uint8Array): BlobData {
    return new BlobData(data, "image/jpeg");
  }
}

export class InvalidBlobDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBlobDataError";
  }
}
