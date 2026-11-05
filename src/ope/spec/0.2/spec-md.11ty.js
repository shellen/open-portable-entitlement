// ABOUTME: Serves the proposed OPE v0.2 specification markdown at /ope/spec/0.2.md.
// ABOUTME: Mirrors /ope/spec.md for the proposed draft.

export const data = {
  permalink: "/ope/spec/0.2.md",
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  return data.spec.versions["0.2"].md;
}
