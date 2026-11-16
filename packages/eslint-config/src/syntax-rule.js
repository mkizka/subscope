export const syntaxRule = (selector, message) => ({
  meta: { type: "problem", schema: [] },
  create: (context) => ({
    [selector]: (node) => context.report({ node, message }),
  }),
});
