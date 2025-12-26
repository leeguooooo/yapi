module.exports = {
    env: {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    extends: ["eslint:recommended", "plugin:react/recommended"],
    parser: "babel-eslint",
    parserOptions: {
        "ecmaFeatures": {
            "jsx": true
        },
        "sourceType": "module"
    },
    plugins: [
        "react",
        "import"
    ],
    rules: {
        "indent": ["off", 2],
        "react/display-name": ["off"],
        "react/jsx-indent": ["error", 2],
        "comma-dangle": ["error", "never"],
        "no-console": ["off"],
        "import/no-unresolved": ["off"],
        "react/no-find-dom-node": ["off"],
        "no-empty": ["off"],
        "no-unused-vars": ["off"],
        "no-undef": ["off"],
        "react/no-deprecated": ["off"],
        "react/prop-types": ["off"],
        "no-restricted-imports": [
            "error",
            {
                "paths": [
                    {
                        "name": "@ant-design/compatible",
                        "message": "Ant Design v1-5 compat layer is disabled. Use antd v6 APIs or client/components/Icon."
                    },
                    {
                        "name": "client/shims/antd-compatible.js",
                        "message": "The legacy antd compat shim is removed. Import modern components instead."
                    }
                ]
            }
        ]
        // "react/no-unescaped-entities": 0
    }
};
