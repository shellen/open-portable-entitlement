// ABOUTME: Serves the OPE v0.1 specification markdown at /ope/spec/0.1.md.
// ABOUTME: Permanent Markdown URL for v0.1, whichever version /ope/spec.md serves.

export const data = {
  permalink: "/ope/spec/0.1.md",
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  return data.spec.versions["0.1"].md;
}
