// postcss.config.js

module.exports = {
  plugins: [
    // 1) postcss-import allows you to use @import in your CSS
    require('postcss-import'),

    // 2) postcss-nested: let you nest CSS selectors similarly to SASS
    require('postcss-nested'),

    // 3) postcss-flexbugs-fixes: tries to fix known flexbox issues
    require('postcss-flexbugs-fixes'),

    // 4) Tailwind CSS
    require('tailwindcss'),

    // 5) Autoprefixer: adds vendor prefixes for cross-browser support
    require('autoprefixer'),

    // 6) cssnano (optional) for minifying your CSS in production builds
    /*
    process.env.NODE_ENV === 'production' &&
      require('cssnano')({
        preset: 'default',
      }),
    */
  ].filter(Boolean), // filter out falsy entries (like cssnano if not in production)
};
