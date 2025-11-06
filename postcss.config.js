import postcssNested from "postcss-nested";
import autoprefixer from "autoprefixer";
import postcssPrettify from "postcss-prettify";

export default {
    plugins: [postcssNested(), autoprefixer(), postcssPrettify()],
};
