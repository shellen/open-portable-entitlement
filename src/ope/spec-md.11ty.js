// ABOUTME: Serves the raw OPE specification markdown at /ope/spec.md.
// ABOUTME: Enables agent and tool discovery of the spec in markdown format.

export const data = {
  permalink: "/ope/spec.md",
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  return data.spec.md;
}
