// 数组方法支持测试
var arr: number[] = [1, 2, 3, 4, 5];

// 基础方法
console.log('length:', arr.length);
console.log('arr[0]:', arr[0]);

// 修改原数组的方法
arr.push(6);
console.log('after push:', arr);

arr.pop();
console.log('after pop:', arr);

arr.unshift(0);
console.log('after unshift:', arr);

arr.shift();
console.log('after shift:', arr);

// 不修改原数组的方法
const mapped = arr.map(x => x * 2);
console.log('mapped:', mapped);

const filtered = arr.filter(x => x > 2);
console.log('filtered:', filtered);

const reduced = arr.reduce((sum, x) => sum + x, 0);
console.log('reduced:', reduced);

const sliced = arr.slice(1, 3);
console.log('sliced:', sliced);

const concated = arr.concat([10, 20]);
console.log('concated:', concated);

// 查找方法
const found = arr.find(x => x > 3);
console.log('found:', found);

const foundIndex = arr.findIndex(x => x > 3);
console.log('foundIndex:', foundIndex);

const includes = arr.includes(3);
console.log('includes:', includes);

const indexOf = arr.indexOf(3);
console.log('indexOf:', indexOf);

// 其他方法
const reversed = arr.reverse();
console.log('reversed:', reversed);

const sorted = arr.sort();
console.log('sorted:', sorted);

const joined = arr.join(',');
console.log('joined:', joined);

const every = arr.every(x => x > 0);
console.log('every:', every);

const some = arr.some(x => x > 4);
console.log('some:', some);

var forEachResult: number[] = [];
arr.forEach(x => forEachResult.push(x));
console.log('forEachResult:', forEachResult);
