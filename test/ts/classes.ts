// 测试类、接口和类型别名

// 接口定义

// 类定义
class Person {
    private name: string;
    private age: number;
    
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
    
    public getName(): string {
        return this.name;
    }
    
    public getAge(): number {
        return this.age;
    }
    
    public introduce(): string {
        return "Hello, my name is " + this.name + " and I am " + this.age + " years old.";
    }
}

// 创建实例
const person = new Person("Alice", 30);
console.log(person.introduce());
console.log("Name:", person.getName());
console.log("Age:", person.getAge());

// 简单的 Employee 类（不继承）
class Employee {
    private name: string;
    private age: number;
    private department: string;
    
    constructor(name: string, age: number, department: string) {
        this.name = name;
        this.age = age;
        this.department = department;
    }
    
    public getDepartment(): string {
        return this.department;
    }
    
    public introduce(): string {
        return "Hello, my name is " + this.name + " and I am " + this.age + " years old. I work in " + this.department;
    }
}

const employee = new Employee("Bob", 25, "Engineering");
console.log(employee.introduce());
console.log("Department:", employee.getDepartment());
