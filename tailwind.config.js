const { toolkitPreset, toolkitContentGlob } = require("@kira-joo/frontend-toolkit-tailwind/tailwind-preset");

/**
 * This app deliberately defines no theme of its own. The toolkit preset ships
 * the semantic role vocabulary with defaults equal to the stock Tailwind
 * palette the components previously hardcoded, so adopting it changes nothing
 * visually here — verified by computed-style comparison on `/login`, not
 * assumed — while making every one of those values themeable by whoever needs
 * to theme them. `nutrition-client` does; this app does not, and that asymmetry
 * is the entire reason the contract is a set of roles rather than a fixed theme.
 *
 * `toolkitContentGlob` replaces the hand-written
 * `./node_modules/@kira-joo/frontend-toolkit-tailwind/dist/**` entry this file
 * used to carry. It is the same directory, resolved absolutely from the
 * installed package's real location instead of relative to this file, so it
 * still matches under a hoisted or workspace install. It has to sit in this
 * app's own `content`: Tailwind 3 silently discards `content` declared by a
 * preset, so a preset cannot supply it however much it looks like it should.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [toolkitPreset],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", toolkitContentGlob],
  theme: {
    extend: {},
  },
  plugins: [],
};
