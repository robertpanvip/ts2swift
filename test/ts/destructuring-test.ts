// 测试解构赋值

// 对象解构
const obj = { name: 'Alice', age: 30, city: 'Beijing' };
const { name, age } = obj;
console.log('name:', name);
console.log('age:', age);

// 对象解构带默认值
const { name: userName, gender = 'unknown' } = obj;
console.log('userName:', userName);
console.log('gender:', gender);

// 数组解构
const arr = [1, 2, 3, 4, 5];
const [first, second, third] = arr;
console.log('first:', first);
console.log('second:', second);
console.log('third:', third);

// 数组解构带默认值
const [x, y, z = 100] = arr;
console.log('x:', x);
console.log('y:', y);
console.log('z:', z);
