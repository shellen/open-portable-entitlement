// ABOUTME: Serves the archived OPE v0.1 specification markdown at /ope/spec/0.1.md.
// ABOUTME: Mirrors /ope/spec.md so tools that fetched v0.1 as markdown can still find it.

export const data = {
  permalink: "/ope/spec/0.1.md",
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  return data.spec.versions["0.1"].md;
}
