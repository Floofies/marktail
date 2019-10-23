# marktail

[![NPM](https://nodei.co/npm/marktail.png)](https://nodei.co/npm/marktail/)

A Babel plugin that marks AST CallExpression nodes which are in proper tail position.

Two properties are added to CallExpression nodes, `tailCall` and `properTailCall`.

- If `tailCall` is set to `true` then the CallExpression is in tail position.

- If `properTailCall` is set to `true` then the CallExpression is a Proper Tail Call.
