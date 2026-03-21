// Symbol 测试
const mySymbol = Symbol('mySymbol');
const sym = Symbol.for('shared');
const sym2 = Symbol.for('shared');

console.log('mySymbol:', mySymbol.toString());
console.log('sym === sym2:', sym === sym2);
console.log('Symbol.keyFor(sym):', Symbol.keyFor(sym));

// 使用 Symbol 作为对象键（通过 subscript）
const obj = Object();
obj['name'] = 'test';
obj['symbolValue'] = 'symbol value';

console.log('obj symbolValue:', obj['symbolValue']);
console.log('obj name:', obj['name']);

// 预定义的 Symbol
console.log('Symbol.iterator:', Symbol.iterator.toString());
