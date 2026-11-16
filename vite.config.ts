import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { rehypePrettyCode } from 'rehype-pretty-code'
import mdx from '@mdx-js/rollup'

type RehypeNode = {
  children: unknown[]
  properties: {
    className: string[]
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  resolve: {
    mainFields: ["module", "browser", "main"],
    conditions: ["module", "module-sync", "browser", "development|production"],
    alias: [
      { find: /^@testing-library\/react$/, replacement: "@testing-library/preact" },
      { find: /^react$/, replacement: "preact/compat" },
      { find: /^react-dom$/, replacement: "preact/compat" },
      { find: /^react-dom\/client$/, replacement: "preact/compat/client" },
      { find: /^react-dom\/server$/, replacement: "preact/compat/server" },
      { find: /^react-dom\/test-utils$/, replacement: "preact/test-utils" },
      { find: /^react\/jsx-runtime$/, replacement: "preact/jsx-runtime" },
      { find: /^react\/jsx-dev-runtime$/, replacement: "preact/jsx-dev-runtime" },
    ],
    dedupe: ["preact"],
  },
  ssr: { resolve: { mainFields: ["module", "main"] }, noExternal: ["react-router", "react-router-dom", "framer-motion", "lucide-react", "@mdx-js/react"] },
  plugins: [
    mdx({
      include: /\.mdx\?metadata$/,
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        () => (tree: { children: { type: string }[] }) => {
          tree.children = tree.children.filter((node) => node.type === "mdxjsEsm");
        },
      ],
    }),
    mdx({
      // Use remark plugins to parse frontmatter
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
      // Use rehype plugins for syntax highlighting
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: 'github-dark',
            onVisitLine(node: RehypeNode) {
              // Prevent lines from becoming overly wide
              if (node.children.length === 0) {
                node.children = [{ type: 'text', value: ' ' }]
              }
            },
            onVisitHighlightedLine(node: RehypeNode) {
              node.properties.className.push('highlighted')
            },
            onVisitHighlightedEmpty(node: RehypeNode) {
              node.properties.className.push('empty')
            },
          },
        ],
      ],
    }),
    preact({ reactAliasesEnabled: false, prefreshEnabled: mode !== "test" }),
  ],
  build: {
    manifest: true,
    // Keep small fonts as files: the production CSP permits self-hosted fonts.
    assetsInlineLimit: (file) => file.endsWith(".woff2") ? false : undefined,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{
            name: "site-shared",
            // Keep common site code together: small startup chunks otherwise
            // add another request round on a cold HTTP/1 connection.
            test: /\/src\/(?:data\/projects\.ts|components\/(?:RouteMeta|NewsletterSignup)\.tsx|lib\/routeMetadata\.ts)$/,
          }],
        },
      },
      onwarn(warning, warn) {
        if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return
        warn(warning)
      },
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: './src/test/setup.ts',
    server: {
      deps: { inline: [/react-router/, /framer-motion/, /lucide-react/, /@mdx-js\/react/, /@testing-library\/preact/] },
    },
  },
}))
