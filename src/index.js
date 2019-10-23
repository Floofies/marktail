function Plugin(babel) {
	const t = babel.types;
	const tryStack = [];
	// Traverses specific expression types and marks a CallExpression in tail position
	function markTailCall(expr) {
		if (expr.type === "CallExpression") {
			expr.tailCall = true;
		} else if (expr.type === "SequenceExpression" && expr.expressions.length > 0) {
			return markTailCall(expr.expressions[expr.expressions.length - 1]);
		} else if (expr.type === "LogicalExpression") {
			if (expr.operator === "&&" || expr.operator === "||")
				return markTailCall(expr.right);
		} else if (expr.type === "ConditionalExpression") {
			markTailCall(expr.consequent);
			return markTailCall(expr.alternate);
		}
	}
	function getParentNode(path) {
		const parentPath = path.getFunctionParent();
		if (parentPath === null) return path.scope.getProgramParent().block;
		return parentPath.node;
	}
	const visitor = {
		"CallExpression": {
			exit: function (path) {
				// Add Proper Tail Call marker property
				if ("tailCall" in path.node && path.node.tailCall) {
					// Check for Proper Tail Call if the call is within a TryStatement
					if (tryStack.length > 0) {
						const tryData = tryStack[tryStack.length - 1];
						const parentNode = getParentNode(path);
						if (parentNode === tryData.functionParent) {
							if (
								tryData.blockType === "finalizer"
								|| tryData.blockType === "catch"
							) {
								path.node.properTailCall = true;
							}
						} else {
							path.node.properTailCall = true;
						}
					} else {
						path.node.properTailCall = true;
					}
				}
				path.skip();
			}
		},
		"ReturnStatement": {
			enter: function (path) {
				if (path.node.argument !== null) markTailCall(path.node.argument);
			}
		},
		"BlockStatement": {
			// Records entry into the "finalizer" block of a TryStatement
			enter: function (path) {
				if (tryStack.length > 0 && tryStack[tryStack.length - 1].blockType === null) {
					const stmtParent = path.getStatementParent();
					if (stmtParent.node.type === "TryStatement") {
						if (stmtParent.node.finalizer === path.node)
							tryStack[tryStack.length - 1].blockType = "finalizer";
						else if (stmtParent.node.handler.body === path.node)
							tryStack[tryStack.length - 1].blockType = "catch";
					}
				}
			},
			// Records exit out of the "finalizer" block of a TryStatement
			exit: function (path) {
				if (tryStack.length > 0 && tryStack[tryStack.length - 1].blockType !== null) {
					const stmtParent = path.getStatementParent();
					if (stmtParent.node.type === "TryStatement") {
						if (
							stmtParent.node.finalizer === path.node
							|| stmtParent.node.handler.body === path.node
						) {
							tryStack[tryStack.length - 1].blockType = null;
						}
					}
				}
			}
		},
		"TryStatement": {
			// Records entry into a TryStatement
			enter: function (path) {
				tryStack.push({
					functionParent: getParentNode(path),
					blockType: null
				});
			},
			// Records exit out of a TryStatement
			exit: function (path) {
				if (tryStack.length > 0) tryStack.pop();
			}
		}
	};
	return { visitor: visitor };
}
module.exports = Plugin;
