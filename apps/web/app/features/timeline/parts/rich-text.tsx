import { ProfileLink } from "./profile-link";

export type TextLink = {
  byteStart: number;
  byteEnd: number;
  uri?: string;
  did?: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function splitByLinks(text: string, links: TextLink[] = []) {
  const bytes = encoder.encode(text);
  const segments: (Omit<TextLink, "byteStart" | "byteEnd"> & {
    text: string;
    start: number;
  })[] = [];
  let cursor = 0;
  for (const link of [...links].sort((a, b) => a.byteStart - b.byteStart)) {
    if (
      link.byteStart < cursor ||
      link.byteEnd <= link.byteStart ||
      link.byteEnd > bytes.length
    )
      continue;
    if (link.byteStart > cursor) {
      segments.push({
        text: decoder.decode(bytes.slice(cursor, link.byteStart)),
        start: cursor,
      });
    }
    segments.push({
      text: decoder.decode(bytes.slice(link.byteStart, link.byteEnd)),
      start: link.byteStart,
      uri: link.uri,
      did: link.did,
    });
    cursor = link.byteEnd;
  }
  if (cursor < bytes.length) {
    segments.push({ text: decoder.decode(bytes.slice(cursor)), start: cursor });
  }
  return segments;
}

export function RichText({
  text,
  links,
}: {
  text: string;
  links?: TextLink[];
}) {
  return splitByLinks(text, links).map((segment) =>
    segment.did ? (
      <ProfileLink
        key={segment.start}
        handle={segment.did}
        className="
          relative text-brand
          hover:underline
        "
      >
        {segment.text}
      </ProfileLink>
    ) : segment.uri && /^https?:\/\//.test(segment.uri) ? (
      <a
        key={segment.start}
        href={segment.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="
          relative text-brand
          hover:underline
        "
      >
        {segment.text}
      </a>
    ) : (
      segment.text
    ),
  );
}
