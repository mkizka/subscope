import { type Did, isDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

export type LabelData = {
  src: string;
  uri: string;
  cid?: string;
  val: string;
  neg?: boolean;
  cts: string;
  exp?: string;
};

export class Label {
  private constructor(
    readonly src: string,
    readonly uri: string,
    readonly val: string,
    readonly cid: string | undefined,
    readonly cts: string,
    readonly exp: string | undefined,
    readonly isNegation: boolean,
  ) {}

  static from(data: LabelData) {
    return new Label(
      data.src,
      data.uri,
      data.val,
      data.cid,
      data.cts,
      data.exp,
      !!data.neg,
    );
  }

  get subjectDid(): Did | null {
    const did = this.uri.startsWith("at://")
      ? new AtUri(this.uri).host
      : this.uri;
    return isDid(did) ? did : null;
  }
}
