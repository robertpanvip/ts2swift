// Bool、Null、Undefined 扩展测试

// Boolean 测试
const bool1: boolean = true;
const bool2: boolean = false;

console.log('bool1:', bool1);
console.log('bool2:', bool2);

// Boolean 构造函数测试
const b1 = Boolean(1);
const b2 = Boolean(0);
const b3 = Boolean('hello');
const b4 = Boolean('');
const b5 = Boolean(null);
const b6 = Boolean(undefined);

console.log('Boolean(1):', b1);
console.log('Boolean(0):', b2);
console.log("Boolean('hello'):", b3);
console.log("Boolean(''):", b4);
console.log('Boolean(null):', b5);
console.log('Boolean(undefined):', b6);

// null 测试
const nullValue = null;
console.log('null:', nullValue);

// undefined 测试
const undefinedValue = undefined;
console.log('undefined:', undefinedValue);
