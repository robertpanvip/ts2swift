// 测试控制流语句

// if-else 语句
const x = 10;
if (x > 5) {
    console.log("x is greater than 5");
}

if (x > 15) {
    console.log("x is greater than 15");
} else {
    console.log("x is not greater than 15");
}

// 多重 if-else
const score = 85;
if (score >= 90) {
    console.log("Grade: A");
} else if (score >= 80) {
    console.log("Grade: B");
} else if (score >= 70) {
    console.log("Grade: C");
} else {
    console.log("Grade: D");
}

// for 循环
let sum: number = 0;
for (let i: number = 1; i <= 5; i = i + 1) {
    sum = sum + i;
}
console.log("Sum 1 to 5:", sum);

// for 循环递减
for (let i: number = 5; i > 0; i = i - 1) {
    console.log("Countdown:", i);
}

// while 循环
let count: number = 0;
while (count < 3) {
    console.log("While count:", count);
    count = count + 1;
}

// do-while 循环（用 while 模拟）
let doCount: number = 0;
console.log("Do-while:", doCount);
doCount = doCount + 1;
while (doCount < 3) {
    console.log("Do-while:", doCount);
    doCount = doCount + 1;
}

// 嵌套循环
console.log("Multiplication table:");
for (let i = 1; i <= 3; i = i + 1) {
    for (let j = 1; j <= 3; j = j + 1) {
        console.log(i * j);
    }
}

// break 和 continue（暂时用 if 模拟）
for (let i = 0; i < 10; i = i + 1) {
    if (i === 3) {
        console.log("Skipping 3");
    } else {
        console.log("Loop i:", i);
    }
}
{

    const arr: number[] = [1, 2, 3, 4, 5];

    console.log('for...of test:');
    for (const num of arr) {
        console.log('num:', num);
    }

// for...in 测试
    const obj = {
        a: 1,
        b: 2,
        c: 3
    };

    console.log('for...in test:');
    for (const key in obj) {
        console.log('key:', key, 'value:', obj[key]);
    }
}