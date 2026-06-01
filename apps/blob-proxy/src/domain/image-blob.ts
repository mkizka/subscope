export class ImageBlob {
  readonly data: Uint8Array;
  readonly contentType: string;

  constructor(params: { data: Uint8Array; contentType: string }) {
    this.data = params.data;
    this.contentType = params.contentType;
  }

  static jpeg(data: Uint8Array): ImageBlob {
    return new ImageBlob({ data, contentType: "image/jpeg" });
  }
}
