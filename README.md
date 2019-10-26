# marktail

[![NPM](https://nodei.co/npm/marktail.png)](https://nodei.co/npm/marktail/)

A Babel plugin that marks CallExpression AST nodes which are tail calls and/or proper tail calls.

Two properties are added to CallExpression nodes, `tailCall` and `properTailCall`.

- If `tailCall` is set to `true` then the CallExpression is in tail position.

- If `properTailCall` is set to `true` then the CallExpression is both in tail position and is a "Proper Tail Call".

This plugin is designed to be used with your own plugins which look for the `tailCall` and `properTailCall` properties within any `CallExpression` AST node.