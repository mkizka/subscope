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
  readonly src: string;
  readonly uri: string;
  readonly val: string;
  readonly cid: string | undefined;
  readonly cts: string;
  readonly exp: string | undefined;
  readonly isNegation: boolean;

  private constructor(params: {
    src: string;
    uri: string;
    val: string;
    cid: string | undefined;
    cts: string;
    exp: string | undefined;
    isNegation: boolean;
  }) {
    this.src = params.src;
    this.uri = params.uri;
    this.val = params.val;
    this.cid = params.cid;
    this.cts = params.cts;
    this.exp = params.exp;
    this.isNegation = params.isNegation;
  }

  static from(data: LabelData) {
    return new Label({
      src: data.src,
      uri: data.uri,
      val: data.val,
      cid: data.cid,
      cts: data.cts,
      exp: data.exp,
      isNegation: !!data.neg,
    });
  }

  get subjectDid(): Did | null {
    const did = this.uri.startsWith("at://")
      ? new AtUri(this.uri).host
      : this.uri;
    return isDid(did) ? did : null;
  }
}
