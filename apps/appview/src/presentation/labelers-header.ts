import { isValidDid } from "@atproto/syntax";

type Labeler = { did: string; redact: boolean };

export const parseLabelerHeader = (header: string | null) => {
  if (header === null) {
    return null;
  }
  const labelers = header
    .split(",")
    .filter((item) => item.trim())
    .map((item): Labeler => {
      const [did = "", ...params] = item.split(";").map((s) => s.trim());
      return { did, redact: params.includes("redact") };
    });
  return labelers.every(({ did }) => isValidDid(did)) ? labelers : null;
};

export const formatLabelerHeader = (labelers: Labeler[]) =>
  labelers.map(({ did, redact }) => (redact ? `${did};redact` : did)).join(",");
