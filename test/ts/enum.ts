// 测试枚举

// 定义枚举
enum Color {
    Red,
    Green,
    Blue
}

// 使用枚举
const favoriteColor: Color = Color.Red;
console.log("Favorite color:", favoriteColor);

// 使用数字初始化枚举
const color2: Color = Color.Green;
console.log("Color 2:", color2);

// 枚举成员访问
if (favoriteColor === Color.Red) {
    console.log("Color is Red");
}

// 字符串枚举
enum Direction {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT"
}

const direction: Direction = Direction.Up;
console.log("Direction:", direction);

if (direction === Direction.Up) {
    console.log("Going up!");
}


