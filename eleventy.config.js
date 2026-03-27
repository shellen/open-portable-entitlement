// ABOUTME: Eleventy configuration for the OPE documentation site.
// ABOUTME: Sets input/output dirs, registers plugins, and configures CSS passthrough.

import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  // Process CSS through PostCSS (Tailwind v4)
  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: async function (inputContent, inputPath) {
      if (!inputPath.includes("main.css")) return;
      const result = await postcss([tailwind]).process(inputContent, {
        from: inputPath,
      });
      return async () => result.css;
    },
  });

  // Pass through JS files
  eleventyConfig.addPassthroughCopy("src/js");

  return {
    pathPrefix: "/open-portable-entitlement/",
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
