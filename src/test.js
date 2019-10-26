const babel = require("@babel/core");
const plugin = require("./index.js");
const src = `
	// 1:  TC  !PTC
	const a = async () => { return call(); };
	// 2:  TC  PTC
	const b = () => { return call(); };
	// 3:  !TC !PTC
	const c = () => { call(); };
	// 4:  TC  !PTC
	async function foo() { return call(); }
	// 5:  TC  !PTC
	function* bar() { return call(); }
	// 6:  TC  PTC
	function baz() { return call(); }
	// 7:  !TC !PTC
	function qux() { call(); }
	// 8:  !TC !PTC, TC  PTC
	function quux() { return lcall() || rcall(); }
	// 9:  !TC !PTC, TC  PTC
	function quay() { return lcall() && rcall(); }
	// 10: TC  PTC,  TC  PTC
	function quuz() { return pred ? lcall() : rcall(); }
	// 11: !TC !PTC, !TC !PTC
	function quiz() { lcall() || rcall(); }
	// 12: !TC !PTC, !TC !PTC
	function chud() { lcall() && rcall(); }
	// 13: !TC !PTC, !TC !PTC
	function crud() { pred ? lcall() : rcall(); }
	// 14: !TC !PTC, !TC !PTC
	function thud() { (lcall(), rcall()); }
	// 15: !TC !PTC, TC  PTC
	function clod() { return (lcall(), rcall()); }
	// 16: !TC !PTC, TC  PTC
	function shod() { try{ return call(); }catch(e){ return call(); }}
	// 17: !TC !PTC, !TC !PTC, TC  PTC
	function chod() { try{ return call(); }catch(e){ return call(); }finally{ return call(); }}
`;
const output = babel.transformSync(src, {
	plugins: [plugin],
	ast: true
});
const body = output.ast.program.body;
const tests = {};
const results = [];
function test(name, node, tc, ptc) {
	if (!(name in tests)) tests[name] = [];
	tests[name].push(function () {
		if (!("tailCall" in node)) results.push("tailCall property is missing in test " + name);
		if (!("properTailCall" in node)) results.push("properTailCall property is missing in test " + name);
		if (node.tailCall && !tc) results.push("A non tail call was erroneously marked as a tail call in test " + name);
		if (node.properTailCall && !ptc) results.push("An non proper tail call was erroneously marked as a proper tail call in test " + name);
	});
}
test(1, body[0].declarations[0].init.body.body[0].argument, true, false);
test(2, body[1].declarations[0].init.body.body[0].argument, true, true);
test(3, body[2].declarations[0].init.body.body[0].expression, false, false);
test(4, body[3].body.body[0].argument, true, false);
test(5, body[4].body.body[0].argument, true, false);
test(6, body[5].body.body[0].argument, true, true);
test(7, body[6].body.body[0].expression, false, false);
test(8, body[7].body.body[0].argument.left, false, false);
test(8, body[7].body.body[0].argument.right, true, true);
test(9, body[8].body.body[0].argument.left, false, false);
test(9, body[8].body.body[0].argument.right, true, true);
test(10, body[9].body.body[0].argument.consequent, true, true);
test(10, body[9].body.body[0].argument.alternate, true, true);
test(11, body[10].body.body[0].expression.left, false, false);
test(11, body[10].body.body[0].expression.right, false, false);
test(12, body[11].body.body[0].expression.left, false, false);
test(12, body[11].body.body[0].expression.right, false, false);
test(13, body[12].body.body[0].expression.consequent, true, true);
test(13, body[12].body.body[0].expression.alternate, true, true);
test(14, body[13].body.body[0].expression.expressions[0], false, false);
test(14, body[13].body.body[0].expression.expressions[1], false, false);
test(15, body[14].body.body[0].argument.expressions[0], false, false);
test(15, body[14].body.body[0].argument.expressions[1], true, true);
test(16, body[15].body.body[0].block.body[0].argument, false, false);
test(16, body[15].body.body[0].handler.body.body[0].argument, true, true);
test(17, body[16].body.body[0].block.body[0].argument, false, false);
test(17, body[16].body.body[0].handler.body.body[0].argument, false, false);
test(17, body[16].body.body[0].finalizer.body[0].argument, true, true);
if (process.argv.length > 2) {
	console.log("Running test " + process.argv[2] + " only.");
	for (const test of tests[process.argv[2]]) test();
} else {
	console.log("Running all " + Object.keys(tests).length + " tests.");
	for (const loc in tests) {
		for (const test of tests[loc]) test();
	}
}
//test(16, body[15].body.body[0].handler.body.body[0], true, true);
if (results.length === 0) console.log("All tests passed.");
else {
	console.log("The following errors were found:");
	for (const result of results) console.log(result);
}