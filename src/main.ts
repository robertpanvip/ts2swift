import {
    Block,
    ClassDeclaration,
    ClassMemberTypes,
    DoStatement,
    ExportAssignment,
    Expression,
    ExpressionStatement,
    ForInStatement,
    ForOfStatement,
    ForStatement,
    FunctionDeclaration,
    IfStatement,
    ImportDeclaration,
    InterfaceDeclaration,
    Node,
    ParameterDeclaration,
    PostfixUnaryExpression,
    Project,
    ReturnStatement,
    SourceFile,
    Statement,
    SwitchStatement,
    TryStatement,
    ts,
    Type,
    TypeAliasDeclaration,
    VariableDeclaration,
    VariableDeclarationKind,
    VariableStatement,
    WhileStatement
} from "ts-morph";
import {cleanOutputDir, generateOutput, generatePackageSwift, isFunctionType, mergeCoreFiles} from "./helper";
import path from 'node:path';
import * as fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CodeResult 类型定义，包含代码和缩进层级
type CodeResult = {
    code: string,
    indentLevel?: number,  // 缩进层级（0=无缩进，1=4 个空格，2=8 个空格，以此类推）
    type?: string
};

// 辅助函数：根据缩进层级生成缩进字符串
function getIndent(level: number = 0): string {
    return '    '.repeat(level);
}

// 辅助函数：为代码添加指定层级的缩进
function indentCode(code: string, level: number = 0): string {
    if (level === 0) return code;
    const indent = getIndent(level);
    return code.split('\n').map(line => indent + line).join('\n');
}

// 辅助函数：合并 CodeResult，考虑缩进
function mergeCodeResults(results: CodeResult[], options: { baseIndent?: number, joinWith?: string } = {}): string {
    const baseIndent = options.baseIndent ?? 0;
    const joinWith = options.joinWith ?? '\n';
    
    return results.map(result => {
        const totalIndent = baseIndent + (result.indentLevel ?? 0);
        return indentCode(result.code, totalIndent);
    }).join(joinWith);
}

const project = new Project();

// 解析命令行参数
const args = process.argv.slice(2);
let tsFiles: string[] = [];

if (args.length > 0) {
    // 只编译用户传入的参数指定的文件
    tsFiles = args;
} else {
    // 默认编译所有测试文件
    tsFiles = ["./test/ts/*.ts"];
}

// 计数器用于生成唯一的匿名类名
let objectLiteralCounter = 0;
// 存储匿名类定义
let anonymousClasses: string[] = [];
// 存储 interface 的定义信息
const interfaceDefinitions: Map<string, {name: string, properties: {name: string, type: string}[]}> = new Map();

// 存储变量定义处的类型（用于检测类型收窄）
// Map<变量名，定义处的 Type 对象>
const typeDefinitions: Map<string, Type> = new Map();

// 辅助函数：检查是否需要类型收窄转换
// 如果变量使用处的类型与定义处的类型不一致，返回需要转换的目标类型
function checkTypeNarrowing(identifier: any, currentType: Type): string | null {
    const name = identifier.getText();
    
    // 获取定义
    const checker = identifier.getProject().getTypeChecker();
    const symbol = checker.getSymbolAtLocation(identifier);
    
    if (!symbol) return null;
    
    // 获取定义的声明
    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) return null;
    
    const decl = declarations[0];
    
    // 获取定义处的类型（直接从声明的 type 属性获取）
    let defType: Type | null = null;
    
    if (Node.isVariableDeclaration(decl)) {
        // 优先使用显式类型注解
        const typeNode = decl.getTypeNode();
        if (typeNode) {
            defType = typeNode.getType();
        } else {
            // 没有显式类型注解，使用初始化表达式的类型
            const initializer = decl.getInitializer();
            if (initializer) {
                defType = initializer.getType();
            }
        }
    } else if (Node.isPropertySignature(decl)) {
        // 使用属性声明的类型
        defType = decl.getType();
    } else if (Node.isParameterDeclaration(decl)) {
        // 使用参数声明的类型
        const typeNode = decl.getTypeNode();
        if (typeNode) {
            defType = typeNode.getType();
        }
    }
    
    // 如果没有获取到定义处的类型，返回 null
    if (!defType) return null;
    
    // 比较类型的文本表示
    const defTypeText = defType.getText();
    const currentTypeText = currentType.getText();
    
    // 如果类型不一致，说明收窄了，返回当前类型用于转换
    if (defTypeText && defTypeText !== currentTypeText) {
        return parseType(currentType);
    }
    
    return null;
}

// 处理对象字面量，返回类名
// interfaceType: 如果有显式类型注解（如 interface），传递类型名以生成包含所有属性的类
// interfaceProperties: interface 中定义的所有属性 [{name, type}, ...]
function processObjectLiteral(expression: any, interfaceType?: string, interfaceProperties?: {name: string, type: string}[]): string {
    // 检查是否有计算属性名（如 [Symbol()]）
    const hasComputedProperty = expression.getProperties().some((property: any) => {
        // 简单检查：如果属性名以 '[' 开头，则是计算属性
        const propName = property.getName ? property.getName() : '';
        return propName.startsWith('[');
    });
    
    // 如果有计算属性名，返回简单的 Object 初始化
    if (hasComputedProperty) {
        return 'Object()';
    }
    
    // 如果有 interfaceProperties，使用 interface 中定义的所有属性
    // 否则只使用对象字面量中实际存在的属性
    const propertiesToUse = interfaceProperties && interfaceProperties.length > 0 
        ? interfaceProperties
        : expression.getProperties().map((p: any) => ({
            name: p.getName(),
            type: 'Any'
        }));
    
    // 生成属性声明（使用 interface 中定义的类型）
    const properties = propertiesToUse.map((propInfo: {name: string, type: string}) => {
        const propName = propInfo.name;
        let propType = propInfo.type; // 使用 interface 中定义的类型
        
        // 如果有 interfaceType，使用 interface 的类型
        if (interfaceType) {
            return { code: `public var ${propName}: ${propType}`, indentLevel: 1 };
        } else {
            // 匿名对象根据实际值推导类型
            const property = expression.getProperties().find((p: any) => {
                if (Node.isPropertyAssignment(p)) {
                    return p.getName() === propName;
                }
                return false;
            });
            
            if (property && Node.isPropertyAssignment(property)) {
                const initializer = property.getInitializer();
                if (Node.isStringLiteral(initializer)) {
                    propType = 'String';
                } else if (Node.isNumericLiteral(initializer)) {
                    propType = 'Number';
                } else if (initializer?.getKindName() === 'TrueKeyword' || initializer?.getKindName() === 'FalseKeyword') {
                    propType = 'Bool';
                } else if (Node.isObjectLiteralExpression(initializer)) {
                    propType = 'Object';
                } else if (Node.isArrayLiteralExpression(initializer)) {
                    propType = 'Array';
                }
            }
            return { code: `public var ${propName}: ${propType}?`, indentLevel: 1 };
        }
    });
    
    const className = interfaceType ? `${interfaceType}Impl` : `AnonymousObject_${objectLiteralCounter++}`;
    
    // 如果有 interfaceType，需要让类继承 Object 并实现 protocol
    // 否则只继承 Object
    const inheritsStr = interfaceType ? `: Object, ${interfaceType}` : `: Object`;
    
    // 如果是匿名对象但有 interfaceType，也需要实现 protocol
    let finalInheritsStr = inheritsStr;
    if (!interfaceType && interfaceProperties && interfaceProperties.length > 0) {
        // 匿名对象但实现了 interface 的属性，添加 protocol 实现
        finalInheritsStr = `: Object, ${interfaceProperties.map(p => p.type.replace('?', '')).join(', ')}`;
    }
    
    // 如果有 interfaceType，不需要调用 super.init()，也不需要 properties 字典
    const needsSuperInit = !interfaceType;
    
    // 生成 init 参数（使用 interface 中定义的类型）
    const initParams = propertiesToUse.map((propInfo: {name: string, type: string}) => {
        const propName = propInfo.name;
        let propType = propInfo.type; // 使用 interface 中定义的类型
        
        // 如果有 interfaceType，使用 interface 的类型
        if (interfaceType) {
            return `${propName}: ${propType}`;
        } else {
            // 匿名对象根据实际值推导类型
            const property = expression.getProperties().find((p: any) => {
                if (Node.isPropertyAssignment(p)) {
                    return p.getName() === propName;
                }
                return false;
            });
            
            if (property && Node.isPropertyAssignment(property)) {
                const initializer = property.getInitializer();
                if (Node.isStringLiteral(initializer)) {
                    propType = 'String';
                } else if (Node.isNumericLiteral(initializer)) {
                    propType = 'Number';
                } else if (initializer?.getKindName() === 'TrueKeyword' || initializer?.getKindName() === 'FalseKeyword') {
                    propType = 'Bool';
                } else if (Node.isObjectLiteralExpression(initializer)) {
                    propType = 'Object';
                } else if (Node.isArrayLiteralExpression(initializer)) {
                    propType = 'Array';
                }
            }
            return `${propName}: ${propType}?`;
        }
    }).join(', ');
    
    // 生成 init 方法体：同时赋值属性字段和 properties 字典
    const initAssignments = propertiesToUse.map((propInfo: {name: string, type: string}) => {
        const propName = propInfo.name;
        return { code: `self.${propName} = ${propName}`, indentLevel: 1 };
    });
    
    // 只有非 interfaceType 才需要 properties 字典
    const propertiesAssignments = needsSuperInit ? propertiesToUse.map((propInfo: {name: string, type: string}) => {
        const propName = propInfo.name;
        return { code: `self.properties["${propName}"] = ${propName}`, indentLevel: 1 };
    }) : [];
    
    // 合并 init 方法体
    const initBodyStatements = needsSuperInit ? [{ code: 'super.init()', indentLevel: 1 }, ...initAssignments, ...propertiesAssignments] : initAssignments;
    const initBody = mergeCodeResults(initBodyStatements, { baseIndent: 0, joinWith: '\n' });
    
    // 构建 class 定义
    const classParts = [
        { code: 'class ' + className + finalInheritsStr + ' {', indentLevel: 0 },
        ...properties,
        { code: '', indentLevel: 0 }, // 空行
        { code: `init(${initParams}) {`, indentLevel: 0 },
        ...initBodyStatements,
        { code: '}', indentLevel: 0 },
        { code: '}', indentLevel: 0 }
    ];
    
    const classDef = mergeCodeResults(classParts, { baseIndent: 0, joinWith: '\n' });
    anonymousClasses.push(classDef);
    
    // 生成初始化参数
    const initArgs = propertiesToUse.map((propInfo: {name: string, type: string}) => {
        const propName = propInfo.name;
        // 查找对象字面量中是否有这个属性
        const property = expression.getProperties().find((p: any) => {
            if (Node.isPropertyAssignment(p)) {
                return p.getName() === propName;
            }
            return false;
        });
        
        if (property && Node.isPropertyAssignment(property)) {
            const initializer = property.getInitializer();
            let propValue = '';
            
            if (Node.isObjectLiteralExpression(initializer)) {
                // 检查属性类型是否是 Interface（如 Address?）
                const propTypeBase = propInfo.type.replace('?', '');
                // 从 Map 中获取 interface 的属性信息
                const nestedInterfaceProps = interfaceDefinitions.get(propTypeBase);
                
                // 递归处理嵌套对象字面量，传递 interface 信息
                propValue = processObjectLiteral(initializer, nestedInterfaceProps ? propTypeBase : undefined, nestedInterfaceProps ? nestedInterfaceProps.properties : undefined);
            } else {
                propValue = parseExpression(initializer).code;
            }
            
            return `${propName}: ${propValue}`;
        } else {
            // 属性未在对象字面量中定义
            // 如果是可选类型（Type?），使用 nil
            // 否则使用 Undefined()
            if (propInfo.type.endsWith('?')) {
                return `${propName}: nil`;
            } else {
                return `${propName}: Undefined()`;
            }
        }
    }).join(', ');
    
    return `${className}(${initArgs})`;
}

function setup() {
    // 清理 output 目录
    cleanOutputDir();

    // 添加 TypeScript 文件
    project.addSourceFilesAtPaths(tsFiles);

    // 处理每个源文件
    project.getSourceFiles().forEach(sourceFile => {
        //console.log(`Processing ${sourceFile.getFilePath()}`);
        // 从文件路径提取文件名（不含扩展名）
        const fileName = path.basename(sourceFile.getFilePath().toString(), '.ts');
        const swiftCode = generateSwiftCode(sourceFile, fileName);
        generateOutput(sourceFile, swiftCode)
    });

    // 生成 main.swift 文件，调用所有 setup 函数
    generateMainSwift(project);

    // 合并 core 文件
    mergeCoreFiles();

    // 生成 Package.swift 文件
    generatePackageSwift();

    console.log('Build completed!');
}

setup();

function generateMainSwift(project: Project) {
    // 执行最后一个文件（入口文件）的 setup
    const sourceFiles = project.getSourceFiles().filter(sf => {
        const filePath = sf.getFilePath().toString();
        return !filePath.includes('core') && !filePath.includes('node_modules');
    });
    
    if (sourceFiles.length === 0) {
        return;
    }
    
    // 获取最后一个文件作为入口文件
    const lastFile = sourceFiles[sourceFiles.length - 1];
    const fileName = path.basename(lastFile.getFilePath().toString(), '.ts').replace(/-/g, '_');
    // 模块名：_文件名 + Module（第一个字母大写）
    const moduleName = '_' + fileName.replace(/^./, m => m.toUpperCase()) + 'Module';
    
    // 生成 main.swift 内容（不使用 @main，直接作为入口文件）
    const mainSwiftCode = `import Foundation

// 自动生成的主入口文件
// 调用入口模块的 __setup

${moduleName}.__setup
`;
    
    // 写入 main.swift 文件
    const mainSwiftPath = path.join(__dirname, '../test/build/Sources/Build/main.swift');
    fs.writeFileSync(mainSwiftPath, mainSwiftCode);
}

function generateSwiftCode(sourceFile: SourceFile, fileName: string): string {
    // 重置匿名类相关变量
    objectLiteralCounter = 0;
    anonymousClasses = [];
    
    let imports = [`import Foundation`];
    let classDeclarations: string[] = [];
    let protocolDeclarations: string[] = [];
    let enumDeclarations: string[] = [];
    let typeAliasDeclarations: string[] = [];
    let functionDeclarations: string[] = [];
    let variableDeclarations: string[] = [];
    let expressions: string[] = [];
    let declarationNames = new Set<string>();
    let topLevelStatements: string[] = [];
    let exportedMembers: string[] = [];
    let importStatements: string[] = [];
    let defaultExportName: string | null = null;
    
    // 处理所有顶层节点
    sourceFile.forEachChild(node => {
        const result = parseNode(node);
        if (result.code) {
            // 跳过导入的变量声明（它们已经在 parseImportDeclaration 中处理了）
            if ((result.code.startsWith('let ') || result.code.startsWith('var ')) &&
                result.code.includes('Imported from')) {
                return;
            }
            
            if (result.code.startsWith('import ')) {
                console.log(`Adding to imports: ${result.code.substring(0, 50)}...`);
                imports.push(result.code);
            } else if (result.code.match(/^typealias\s+/)) {
                // typealias 声明添加到 typeAliasDeclarations 中
                console.log(`Adding to typeAliasDeclarations: ${result.code.substring(0, 50)}...`);
                const match = result.code.match(/typealias\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match) {
                    const typeAliasName = match[1];
                    if (!declarationNames.has(typeAliasName)) {
                        declarationNames.add(typeAliasName);
                        typeAliasDeclarations.push(result.code);
                    }
                } else {
                    typeAliasDeclarations.push(result.code);
                }
            } else if (result.code.match(/^let\s+/)) {
                // 导入语句（let x = Module.y）
                console.log(`Adding to importStatements: ${result.code.substring(0, 50)}...`);
                importStatements.push(result.code);
            } else if (result.code.includes('class ')) {
                console.log(`Adding to classDeclarations: ${result.code.substring(0, 50)}...`);
                // 提取类名，用于去重
                const match = result.code.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match) {
                    const className = match[1];
                    if (!declarationNames.has(className)) {
                        declarationNames.add(className);
                        classDeclarations.push(result.code);
                    }
                } else {
                    classDeclarations.push(result.code);
                }
            } else if (result.code.includes('protocol ')) {
                console.log(`Adding to protocolDeclarations: ${result.code.substring(0, 50)}...`);
                // 提取协议名，用于去重
                const match = result.code.match(/protocol\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match) {
                    const protocolName = match[1];
                    if (!declarationNames.has(protocolName)) {
                        declarationNames.add(protocolName);
                        protocolDeclarations.push(result.code);
                    }
                } else {
                    protocolDeclarations.push(result.code);
                }
            } else if (result.code.includes('enum ')) {
                console.log(`Adding to enumDeclarations: ${result.code.substring(0, 50)}...`);
                // 提取枚举名，用于去重
                const match = result.code.match(/enum\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match) {
                    const enumName = match[1];
                    if (!declarationNames.has(enumName)) {
                        declarationNames.add(enumName);
                        enumDeclarations.push(result.code);
                    }
                } else {
                    enumDeclarations.push(result.code);
                }
            } else if (result.code.includes('func ')) {
                // 检查是否有 export 修饰符（public 前缀）
                result.code.startsWith('public ');
// 检查是否是默认导出的函数
                if (result.code.includes('DEFAULT_EXPORT')) {
                    // 提取默认导出的函数名
                    const match = result.code.match(/func\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (match) {
                        defaultExportName = match[1];
                        console.log(`Found default export: ${defaultExportName}`);
                    }
                }
                
                // 提取函数名，用于去重（包括导入的函数）
                const match = result.code.match(/func\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match) {
                    const functionName = match[1];
                    if (!declarationNames.has(functionName)) {
                        declarationNames.add(functionName);
                        // 所有函数都添加到 functionDeclarations 中（作为静态成员）
                        // 检查是否已经有 static
                        if (result.code.includes(' static ')) {
                            // 已经有 static，直接添加
                            functionDeclarations.push(result.code);
                        } else if (!result.code.startsWith('public ')) {
                            // 非导出的函数添加 public static 前缀
                            const staticFunc = result.code.replace(/^func/, 'public static func');
                            functionDeclarations.push(staticFunc);
                        } else {
                            // 导出的函数，添加 static（包括默认导出）
                            const staticFunc = result.code.replace(/^public func/, 'public static func');
                            functionDeclarations.push(staticFunc);
                        }
                    }
                } else {
                    functionDeclarations.push(result.code);
                }
            } else if (result.code.match(/^(public\s+)?(let|var)\s/)) {
                // 检查是否有 export 修饰符（public 前缀）
                const isExported = result.code.startsWith('public ');
                
                // 提取变量名，用于去重（包括导入的变量和导出的变量）
                const match = result.code.match(/^(public\s+)?(let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match) {
                    const variableName = match[3];
                    if (!declarationNames.has(variableName)) {
                        declarationNames.add(variableName);
                        // 只有导出的变量才添加到 variableDeclarations 中（作为静态成员）
                        if (isExported) {
                            variableDeclarations.push(result.code);
                        } else {
                            // 非导出的变量添加到 topLevelStatements 中（在 setup 方法内部）
                            topLevelStatements.push(result.code);
                        }
                    }
                } else {
                    // 没有匹配到变量名，添加到 topLevelStatements 中
                    topLevelStatements.push(result.code);
                }
            } else {
                // 表达式语句（包括 do 块、if 语句等）
                expressions.push(result.code);
                // 同时添加到 topLevelStatements 中
                topLevelStatements.push(result.code);
            }
        }
    });

    // 去重导入
    const uniqueImports = Array.from(new Set(imports));
    
    // 将匿名类添加到类声明中
    anonymousClasses.forEach(classDef => {
        classDeclarations.push(classDef);
    });
    
    // 生成模块 enum（使用 enum 不需要 init）
    // 模块名：_路径 + 文件名 + Module（第一个字母大写）
    const moduleName = '_' + fileName.replace(/[^a-zA-Z0-9]/g, '_').replace(/^./, m => m.toUpperCase()) + 'Module';
    let moduleCode = '';
    
    // 收集导出的成员（变量、函数、类）
    // exportedMembers 已经在前面定义了
    
    // 处理导出的变量 - 作为静态属性
    variableDeclarations.forEach(v => {
        // 移除 public 关键字
        const cleanedVar = v.replace(/^public\s+/, '');
        exportedMembers.push(`public static ${cleanedVar}`);
    });
    
    // 处理导出的函数 - 作为静态方法
    functionDeclarations.forEach(f => {
        // 函数已经有 public static 前缀，直接添加
        exportedMembers.push(f);
    });
    
    // 检查是否有 main 函数
    functionDeclarations.some(f => f.includes('func main(') || f.includes('func main()'));
// 处理导出的类 - 添加到 exportedMembers 中
    classDeclarations.forEach(c => {
        // 确保类是 public 的（在 enum 内部需要 public 访问级别）
        if (!c.startsWith('public ')) {
            c = 'public ' + c;
        }
        exportedMembers.push(c);
    });
    
    // 生成模块 enum
    if (exportedMembers.length > 0 || topLevelStatements.length > 0) {
        moduleCode = `\npublic enum ${moduleName} {\n`;
        
        // 添加 default 静态属性，指向默认导出的函数（如果有）
        if (defaultExportName) {
            moduleCode += `    public static let \`default\` = ${moduleName}.${defaultExportName}\n`;
        } else {
            moduleCode += `    public static let \`default\` = { }\n`;
        }
        
        // 添加成员
        if (exportedMembers.length > 0) {
            // 对每个成员的所有行添加 4 个空格的缩进（enum 层级）
            const indentedMembers = exportedMembers.map(member => {
                return member.split('\n').map(line => '    ' + line).join('\n');
            }).join('\n');
            moduleCode += `${indentedMembers}\n`;
        }
        
        // 添加 typealias 声明
        if (typeAliasDeclarations.length > 0) {
            // 确保 typealias 是 public 的
            const publicTypeAliases = typeAliasDeclarations.map(t => {
                if (!t.startsWith('public ')) {
                    return 'public ' + t;
                }
                return t;
            });
            moduleCode += `    \n    ${publicTypeAliases.join('\n    ')}\n`;
        }
        
        // 生成静态计算属性用于执行顶层语句
        moduleCode += `    \n    public static var __setup: Void {\n`;
        // 先触发被导入模块的 __setup（从导入语句中提取模块名）
        const triggeredModules = new Set<string>();
        importStatements.forEach(stmt => {
            const match = stmt.match(/=\s*([a-zA-Z_][a-zA-Z0-9_]*)\./);
            if (match) {
                const moduleName = match[1];
                // 只触发模块的 __setup（模块名以 _ 开头）
                if (moduleName.startsWith('_') && !triggeredModules.has(moduleName)) {
                    triggeredModules.add(moduleName);
                    moduleCode += `        let _ = ${moduleName}.__setup\n`;
                }
            }
        });
        // 然后执行导入语句
        if (importStatements.length > 0) {
            // 对每个导入语句的所有行添加缩进
            const indentedImports = importStatements.map(stmt => {
                return stmt.split('\n').map(line => '        ' + line).join('\n');
            }).join('\n');
            moduleCode += `${indentedImports}\n`;
        }
        // 然后执行顶层语句
        if (topLevelStatements.length > 0) {
            // 对每个顶层语句的所有行添加缩进
            const indentedStatements = topLevelStatements.map(stmt => {
                return stmt.split('\n').map(line => '        ' + line).join('\n');
            }).join('\n');
            moduleCode += `${indentedStatements}\n`;
        }
        // 最后启动事件循环执行微任务和宏任务
        moduleCode += `        \n        // 启动事件循环执行所有异步任务\n        EventLoop.shared.run(timeout: 1.0)\n`;
        moduleCode += `    }\n`;
        
        moduleCode += `}\n`;
    }
    
    // 组合代码（不包括类，因为它们已经在 enum 内部）
    const allDeclarations = [...protocolDeclarations, ...enumDeclarations, ...anonymousClasses].join('\n\n');
    
    // 添加辅助函数
    const helperFunctions = generateGetTypeNameHelper();
    
    return `${uniqueImports.join('\n')}\n\n${helperFunctions}\n${moduleCode}\n${allDeclarations}\n\n`;
}

function parseStatement(statement: Statement): CodeResult {
    if (Node.isVariableStatement(statement)) {
        return parseVariableStatement(statement);
    } else if (Node.isFunctionDeclaration(statement)) {
        return parseFunctionDeclaration(statement);
    } else if (Node.isClassDeclaration(statement)) {
        return parseClassDeclaration(statement);
    } else if (Node.isInterfaceDeclaration(statement)) {
        return parseInterfaceDeclaration(statement);
    } else if (Node.isTypeAliasDeclaration(statement)) {
        return parseTypeAliasDeclaration(statement);
    } else if (Node.isImportDeclaration(statement)) {
        return parseImportDeclaration(statement);
    } else if (Node.isExpressionStatement(statement)) {
        return parseExpressionStatement(statement);
    } else if (Node.isIfStatement(statement)) {
        return parseIfStatement(statement);
    } else if (Node.isForStatement(statement)) {
        return parseForStatement(statement);
    } else if (Node.isForOfStatement(statement)) {
        return parseForOfStatement(statement);
    } else if (Node.isForInStatement(statement)) {
        return parseForInStatement(statement);
    } else if (Node.isWhileStatement(statement)) {
        return parseWhileStatement(statement);
    } else if (Node.isDoStatement(statement)) {
        return parseDoWhileStatement(statement);
    } else if (Node.isSwitchStatement(statement)) {
        return parseSwitchStatement(statement);
    } else if (Node.isTryStatement(statement)) {
        return parseTryStatement(statement);
    } else if (Node.isReturnStatement(statement)) {
        return parseReturnStatement(statement);
    } else if (Node.isExportAssignment(statement)) {
        return parseExportAssignment(statement);
    } else if (Node.isEnumDeclaration(statement)) {
        return parseEnumDeclaration(statement);
    }
    return {code: ''};
}

function parseVariableStatement(statement: VariableStatement): CodeResult {
    const isExport = statement.hasModifier(ts.SyntaxKind.ExportKeyword);
    const declarations = statement.getDeclarationList().getDeclarations();
    const declarationKind = statement.getDeclarationList().getDeclarationKind();

    const variableDeclarations = declarations.map((declaration: VariableDeclaration) => {
        const nameNode = declaration.getNameNode();
        
        // 检查是否是解构模式
        if (nameNode.getKind() === ts.SyntaxKind.ObjectBindingPattern) {
            // 对象解构：const { name, age } = obj
            return parseObjectDestructuring(declaration, declarationKind);
        } else if (nameNode.getKind() === ts.SyntaxKind.ArrayBindingPattern) {
            // 数组解构：const [a, b] = arr
            return parseArrayDestructuring(declaration, declarationKind);
        }
        
        let name = declaration.getName();
        // 检查是否是 Swift 关键字，如果是则添加反引号
        const swiftKeywords = ['nil', 'var', 'let', 'class', 'func', 'if', 'else', 'switch', 'case', 'default', 'do', 'while', 'for', 'in', 'return', 'break', 'continue', 'throw', 'try', 'catch', 'guard', 'where', 'is', 'as', 'super', 'self', 'init', 'deinit', 'typealias', 'struct', 'enum', 'extension', 'protocol', 'associatedtype', 'operator', 'precedencegroup', 'rethrows', 'defer', 'repeat', 'some', 'any', 'Type', 'Self'];
        if (swiftKeywords.includes(name)) {
            name = `\`${name}\``;
        }
        // 优先使用显式类型注解，如果没有则使用推断的类型
        const typeNode = declaration.getTypeNode();
        const type = typeNode ? declaration.getType() : declaration.getType();
        const initializer = declaration.getInitializer();

        let typeStr = typeNode ? parseTypeNode(typeNode) : parseType(type);
        let initializerStr = '';
        let initializerCode = '';
        let finalTypeStr = typeStr;
        let shouldOmitType = false;

        if (initializer) {
            // 解析初始化表达式
            initializerCode = parseExpression(initializer).code;
            
            // 检查初始化表达式是否包含可选链（?.）
            const initializerText = initializer.getFullText();
            const hasOptionalChain = initializerText.includes('?.');
            
            // 如果包含可选链，需要在表达式后添加 ?? 转换
            // TypeScript 可能收窄了类型，但运行时返回的是可选类型
            // 使用 ?? 提供默认值（nil），让变量类型自动推断为可选
            if (hasOptionalChain && !typeNode && typeStr !== 'Any' && !typeStr.endsWith('?')) {
                // 使用可选绑定，如果值为 nil 则使用 nil（自动推断为可选类型）
                initializerCode = `${initializerCode}`;
                // 将类型改为可选类型
                if (!finalTypeStr.endsWith('?')) {
                    finalTypeStr = `${typeStr}?`;
                }
            }
            
            // 检查初始化表达式是否是对象字面量
            const isObjectLiteral = Node.isObjectLiteralExpression(initializer);
            
            if (isObjectLiteral) {
                // 检查是否有显式类型注解（如 interface 或 class）
                const hasExplicitType = typeNode !== undefined;
                
                if (hasExplicitType) {
                    // 有显式类型注解，使用 interface/class 类型生成类
                    // 生成实现类（如 PersonImpl）
                    const implClassName = typeStr + 'Impl';
                    finalTypeStr = typeStr;
                    
                    // 从 Map 中获取 interface 的属性信息
                    const interfaceProps = interfaceDefinitions.get(typeStr);
                    
                    // 生成实现类（从 interface 获取所有属性）
                    const initializerCodeFromLiteral = processObjectLiteral(initializer, typeStr, interfaceProps ? interfaceProps.properties : undefined);
                    initializerCode = initializerCodeFromLiteral;
                } else {
                    // 无类型注解，生成 AnonymousObject_*
                    // 生成匿名类（递归处理嵌套对象）
                    const initializerCodeFromLiteral = processObjectLiteral(initializer);
                    initializerCode = initializerCodeFromLiteral;
                    // 省略类型注解，让 Swift 自动推断为匿名类类型
                    shouldOmitType = true;
                }
            } else if (Node.isNewExpression(initializer)) {
                // new 表达式，使用类名作为类型
                initializerCode = parseExpression(initializer).code;
                // 获取类名
                const className = initializer.getExpression().getText();
                finalTypeStr = className;
            } else if (Node.isCallExpression(initializer)) {
                // CallExpression（如 Symbol()），让 Swift 推断类型
                // 但 Promise 相关调用需要保留类型注解
                const callExpr = initializer as CallExpression;
                const expr = callExpr.getExpression();
                const exprText = expr.getText();
                
                // 检查是否是 Promise 相关的调用
                const isPromiseCall = exprText.includes('Promise.') || exprText.startsWith('Promise');
                
                if (isPromiseCall) {
                    // Promise 调用，保留类型注解
                    initializerCode = parseExpression(initializer).code;
                } else {
                    // 其他调用，省略类型注解
                    initializerCode = parseExpression(initializer).code;
                    shouldOmitType = true;
                }
            } else {
                initializerCode = parseExpression(initializer).code;
            }
            
            // 如果初始化表达式是闭包，让 Swift 自动推断类型
            if (initializerCode.trim().startsWith('{')) {
                shouldOmitType = true;
            }
            // 如果类型是 Any? 且初始化表达式是 Null()，将类型改为 Any
            if (typeStr === 'Any?' && initializerCode === 'Null()') {
                initializerStr = ` = ${initializerCode}`;
                finalTypeStr = 'Any';
            } else {
                initializerStr = ` = ${initializerCode}`;
            }
        } else {
            // 为全局声明添加默认初始化表达式
            if (typeStr === 'Double') {
                initializerStr = ' = 0.0';
            } else if (typeStr === 'String') {
                initializerStr = ' = ""';
            } else if (typeStr === 'Bool') {
                initializerStr = ' = false';
            } else if (typeStr === 'Any?') {
                // 对于 Any? 类型，使用 nil 作为默认值，但将类型改为 Any
                initializerStr = ' = nil';
                finalTypeStr = 'Any';
            } else if (typeStr.startsWith('[')) {
                // 数组类型
                initializerStr = ' = []';
            } else {
                // 其他类型使用 nil
                initializerStr = ' = nil';
            }
        }

        // TypeScript 中的 const 转换为 Swift 中的 let（不可变）
        // TypeScript 中的 let 转换为 Swift 中的 var（可变）
        const swiftDeclarationKind = declarationKind === VariableDeclarationKind.Const ? 'let' : 'var';

        // 如果需要省略类型注解，则不添加
        const typeAnnotation = shouldOmitType ? '' : `: ${finalTypeStr}`;
        return `${isExport ? 'public ' : ''}${swiftDeclarationKind} ${name}${typeAnnotation}${initializerStr}`;
    });

    return {code: variableDeclarations.join('\n')};
}

// 解析对象解构赋值
function parseObjectDestructuring(declaration: VariableDeclaration, declarationKind: VariableDeclarationKind): string {
    const nameNode = declaration.getNameNode() as any;
    const initializer = declaration.getInitializer();
    
    if (!initializer) {
        // 没有初始化表达式，无法解构
        return '';
    }
    
    const initializerCode = parseExpression(initializer).code;
    const swiftDeclarationKind = declarationKind === VariableDeclarationKind.Const ? 'let' : 'var';
    
    // 获取解构的元素
    const elements = nameNode.getElements ? nameNode.getElements() : [];
    const declarations: string[] = [];
    
    for (const element of elements) {
        // 对于 { name: userName } 这种语法：
        // TypeScript AST 中，BindingElement 的结构是：
        // { propertyName: Identifier, name: Identifier }
        // 其中 propertyName 是属性名（name），name 是变量名（userName）
        
        // 使用 ts-morph 的 API 获取 name 节点
        const nameNode = element.getNameNode ? element.getNameNode() : null;
        const variableName = nameNode ? nameNode.getText() : '';
        
        // 获取 propertyName 节点 - 使用 ts 包直接访问
        const elementAny = element as any;
        let propertyName = variableName; // 默认使用变量名
        
        // 尝试访问底层的 ts.BindingPattern 的 propertyName
        if (elementAny.compilerNode && elementAny.compilerNode.propertyName) {
            const propNameNode = elementAny.compilerNode.propertyName;
            if (propNameNode && propNameNode.text) {
                propertyName = propNameNode.text;
            }
        }
        
        const initializer = element.getInitializer ? element.getInitializer() : null;
        
        // 生成 Swift 代码：let userName = obj.name
        let declCode = `${swiftDeclarationKind} ${variableName} = ${initializerCode}.${propertyName}`;
        
        // 如果有默认值
        if (initializer) {
            const defaultVal = parseExpression(initializer).code;
            declCode += ` ?? ${defaultVal}`;
        }
        
        declarations.push(declCode);
    }
    
    return declarations.join('\n');
}

// 解析数组解构赋值
function parseArrayDestructuring(declaration: VariableDeclaration, declarationKind: VariableDeclarationKind): string {
    const nameNode = declaration.getNameNode() as any;
    const initializer = declaration.getInitializer();
    
    if (!initializer) {
        // 没有初始化表达式，无法解构
        return '';
    }
    
    const initializerCode = parseExpression(initializer).code;
    const swiftDeclarationKind = declarationKind === VariableDeclarationKind.Const ? 'let' : 'var';
    
    // 获取解构的元素
    const elements = nameNode.getElements ? nameNode.getElements() : [];
    const declarations: string[] = [];
    
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const variableName = element.getName ? element.getName() : `_${i}`;
        const initializer = element.getInitializer ? element.getInitializer() : null;
        
        // 生成 Swift 代码：let a = arr[0]
        let declCode = `${swiftDeclarationKind} ${variableName} = ${initializerCode}[${i}]`;
        
        // 如果有默认值
        if (initializer) {
            const defaultVal = parseExpression(initializer).code;
            declCode += ` ?? ${defaultVal}`;
        }
        
        declarations.push(declCode);
    }
    
    return declarations.join('\n');
}

// 辅助函数：转换 async 函数体（使用 Babel 风格的状态机）
function transformAsyncBody(body: Block, returnTypeStr: string): string {
    const statements = body.getStatements();
    
    // 收集所有 await 表达式
    const awaitExpressions: any[] = [];
    const statementInfos: { stmt: any; awaitIndex: number[] }[] = [];
    
    // 遍历语句，记录每个语句中的 await 位置
    for (const stmt of statements) {
        const awaitIndices: number[] = [];
        // 使用 forEachDescendant 遍历所有后代节点
        stmt.forEachDescendant(child => {
            if (child.getKind() === ts.SyntaxKind.AwaitExpression) {
                awaitIndices.push(awaitExpressions.length);
                awaitExpressions.push(child);
            }
        });
        statementInfos.push({ stmt, awaitIndex: awaitIndices });
    }
    
    // 如果没有 await，直接包装返回值
    if (awaitExpressions.length === 0) {
        // 检查是否是 return 语句
        if (statements.length === 1 && Node.isReturnStatement(statements[0])) {
            const returnStmt = statements[0] as ReturnStatement;
            const expr = returnStmt.getExpression();
            if (expr) {
                const exprCode = parseExpression(expr).code;
                return `{\n    return Promise<Any>.resolve(${exprCode})\n}`;
            } else {
                return `{\n    return Promise<Any>.resolve(())\n}`;
            }
        }
        
        // 其他语句，照搬
        const stmts = statements
            .map(statement => parseStatement(statement).code)
            .join('\n');
        const indentedStmts = stmts.split('\n').map(line => '    ' + line).join('\n');
        return `{\n${indentedStmts}\n}`;
    }
    
    // 有 await，使用 Promise 链式调用
    // 构建一个简化的状态机
    let chainCode = 'return ';
    
    // 从第一个语句开始构建 Promise 链
    chainCode += buildPromiseChain(statementInfos, 0, 'undefined');
    
    return `{\n    ${chainCode}\n}`;
}

// 辅助函数：构建 Promise 链
function buildPromiseChain(statementInfos: any[], stmtIndex: number, prevValue: string, indentLevel: number = 0): string {
    const indent = '    '.repeat(indentLevel);
    const nextIndent = '    '.repeat(indentLevel + 1);
    
    if (stmtIndex >= statementInfos.length) {
        // 所有语句处理完毕，返回 Promise.resolve()
        return `${indent}Promise<Any>.resolve(())`;
    }
    
    const { stmt, awaitIndex } = statementInfos[stmtIndex];
    const stmtCode = parseStatement(stmt).code;
    
    // 如果语句中没有 await，直接执行并继续下一个
    if (awaitIndex.length === 0) {
        const nextChain = buildPromiseChain(statementInfos, stmtIndex + 1, 'undefined', indentLevel + 1);
        return `${indent}Promise<Any>.resolve(()).then(onFulfilled: { _ in\n${nextIndent}${stmtCode}\n${nextChain}\n${indent}})`;
    }
    
    // 有 await，需要转换为 then 链
    // 简化处理：只处理单个 await 的情况
    if (awaitIndex.length === 1) {
        // 处理 const x = await fn() 这种情况
        if (Node.isVariableStatement(stmt)) {
            const varStmt = stmt as VariableStatement;
            const declarations = varStmt.getDeclarationList().getDeclarations();
            if (declarations.length > 0) {
                const decl = declarations[0];
                const varName = decl.getName();
                const initializer = decl.getInitializer();
                
                if (initializer && initializer.getKind() === ts.SyntaxKind.AwaitExpression) {
                    const awaitExprAny = initializer as any;
                    const promiseExpr = awaitExprAny.getExpression ? awaitExprAny.getExpression() : null;
                    const promiseCode = parseExpression(promiseExpr).code;
                    
                    // 转换为：promise.then(x => { 下一个语句 })
                    const nextChain = buildPromiseChain(statementInfos, stmtIndex + 1, varName, indentLevel + 1);
                    return `${indent}${promiseCode}.then(onFulfilled: { ${varName} in\n${nextChain}\n${indent}})`;
                }
            }
        }
        
        // 其他情况：await 在非变量声明语句中
        // 找到语句中的第一个 await 表达式
        let firstAwaitExpr: any = null;
        stmt.forEachDescendant(child => {
            if (!firstAwaitExpr && child.getKind() === ts.SyntaxKind.AwaitExpression) {
                firstAwaitExpr = child;
            }
        });
        
        if (firstAwaitExpr) {
            const expr = firstAwaitExpr.getExpression ? firstAwaitExpr.getExpression() : null;
            const exprCode = parseExpression(expr).code;
            
            const nextChain = buildPromiseChain(statementInfos, stmtIndex + 1, 'undefined', indentLevel + 1);
            return `${indent}${exprCode}.then(onFulfilled: { _ in\n${nextIndent}${stmtCode}\n${nextChain}\n${indent}})`;
        }
        
        // 如果没有找到 await 表达式，直接执行语句
        const nextChain = buildPromiseChain(statementInfos, stmtIndex + 1, 'undefined', indentLevel + 1);
        return `${indent}Promise<Any>.resolve(()).then(onFulfilled: { _ in\n${nextIndent}${stmtCode}\n${nextChain}\n${indent}})`;
    }
    
    // 多个 await 的复杂情况，使用简化处理
    const stmts = statementInfos.slice(stmtIndex)
        .map(info => parseStatement(info.stmt).code)
        .join(`\n${nextIndent}`);
    
    return `${indent}Promise<Any>.resolve(()).then(onFulfilled: { _ in\n${nextIndent}${stmts}\n${nextIndent}return Promise<Any>.resolve(())\n${indent}})`;
}

function parseFunctionDeclaration(statement: FunctionDeclaration): CodeResult {
    const isExport = statement.hasModifier(ts.SyntaxKind.ExportKeyword);
    const isDefault = statement.hasModifier(ts.SyntaxKind.DefaultKeyword);
    const isAsync = statement.hasModifier(ts.SyntaxKind.AsyncKeyword);
    const name = statement.getName() || '';
    
    console.log(`parseFunctionDeclaration: ${name}, isExport=${isExport}, isDefault=${isDefault}, isAsync=${isAsync}`);
    
    const parameters = statement.getParameters();
    const returnType = statement.getReturnType();
    const body = statement.getBody();
    
    // 获取泛型参数
    const typeParameters = statement.getTypeParameters() || [];
    const genericParams = typeParameters.map(tp => {
        const tpName = tp.getName();
        const constraint = tp.getConstraint();
        if (constraint) {
            // 处理泛型约束 T extends SomeType
            const constraintType = parseType(constraint);
            return `${tpName}: ${constraintType}`;
        }
        return tpName;
    }).join(', ');
    let genericStr = '';
    if (genericParams) {
        genericStr = `<${genericParams}>`;
    }

    const params = parameters.map((param: ParameterDeclaration) => {
        const paramName = param.getName();
        const paramType = parseType(param.getType());
        // 添加 _ 参数标签，允许调用时省略标签
        return `_ ${paramName}: ${paramType}`;
    }).join(', ');

    // 获取返回类型字符串
    let returnTypeStr = parseType(returnType);
    
    // 如果 returnTypeStr 是 Promise 但没有泛型参数，尝试从类型注解中获取
    if (returnTypeStr === 'Promise') {
        // 尝试从返回类型注解中获取泛型参数
        const returnTypeNode = statement.getReturnTypeNode();
        if (returnTypeNode) {
            const returnTypeText = returnTypeNode.getText();
            if (returnTypeText.startsWith('Promise<') && returnTypeText.endsWith('>')) {
                // 提取泛型参数
                const genericParam = returnTypeText.substring(8, returnTypeText.length - 1);
                // 转换基本类型
                if (genericParam === 'string') returnTypeStr = 'Promise<String>';
                else if (genericParam === 'number') returnTypeStr = 'Promise<Number>';
                else if (genericParam === 'boolean') returnTypeStr = 'Promise<Bool>';
                else if (genericParam === 'void') returnTypeStr = 'Promise<Void>';
                else if (genericParam === 'any') returnTypeStr = 'Promise<Any>';
                else returnTypeStr = `Promise<${genericParam}>`;
            }
        }
    }
    
    // 处理 async 函数的返回类型
    if (isAsync) {
        // async 函数返回 Promise<T>，转换为 Promise<T>
        // 如果 returnTypeStr 已经是 Promise<...>，不需要处理
        // 否则需要包装
        // 使用 Promise<Any> 而不是 Promise<Void> 以避免类型推断问题
        if (returnTypeStr === 'Void') {
            returnTypeStr = 'Promise<Any>';
        } else if (!returnTypeStr.startsWith('Promise')) {
            returnTypeStr = `Promise<${returnTypeStr}>`;
        } else {
            // 如果已经是 Promise 类型，将泛型参数改为 Any
            returnTypeStr = 'Promise<Any>';
        }
    }
    
    let bodyStr = '{}';
    if (body) {
        if (isAsync) {
            // async 函数，需要转换函数体
            bodyStr = transformAsyncBody(body as Block, returnTypeStr);
        } else {
            // 直接获取块内的语句，不添加外层花括号
            const statements = (body as Block).getStatements()
                .map(statement => parseStatement(statement).code)
                .join('\n');
            // 为每一行添加 4 个空格的缩进（函数体内的缩进）
            const indentedStatements = statements.split('\n').map(line => '    ' + line).join('\n');
            bodyStr = `{\n${indentedStatements}\n}`;
        }
    }
    
    // 当返回类型是 void 时，不添加返回类型
    const returnTypePart = returnTypeStr === 'Void' ? '' : `-> ${returnTypeStr}`;
    
    // 如果是默认导出，添加特殊标记
    const defaultMarker = isDefault ? ' // DEFAULT_EXPORT' : '';
    
    // async 函数返回 Promise，不需要额外的 async 关键字
    // TypeScript 的 async 编译后就是返回 Promise 的普通函数
    return {
        code: `${isExport ? 'public ' : ''}func ${name}${genericStr}(${params}) ${returnTypePart} ${bodyStr}${defaultMarker}`
    };
}

function parseClassDeclaration(statement: ClassDeclaration): CodeResult {
    const isExport = statement.hasModifier(ts.SyntaxKind.ExportKeyword);
    const isAbstract = statement.hasModifier(ts.SyntaxKind.AbstractKeyword);
    const name = statement.getName() || 'AnonymousClass';
    const members = statement.getMembers();
    
    // 获取泛型参数
    const typeParameters = statement.getTypeParameters() || [];
    const genericParams = typeParameters.map(tp => tp.getName()).join(', ');
    let genericStr = '';
    if (genericParams) {
        genericStr = `<${genericParams}>`;
    }
    
    // 获取实现的接口（protocols）和继承的类
    const heritageClauses = statement.getHeritageClauses() || [];
    const implementsTypes: string[] = [];
    const extendsTypes: string[] = [];
    
    heritageClauses.forEach(clause => {
        const types = clause.getTypeNodes() || [];
        if (clause.getToken() === ts.SyntaxKind.ExtendsKeyword) {
            // extends - 继承类
            types.forEach(type => {
                extendsTypes.push(type.getExpression().getText());
            });
        } else if (clause.getToken() === ts.SyntaxKind.ImplementsKeyword) {
            // implements - 实现协议
            types.forEach(type => {
                implementsTypes.push(type.getExpression().getText());
            });
        }
    });
    
    // 合并继承类型（Swift 使用 : 分隔）
    let inheritsStr = '';
    const allInherits = [...extendsTypes, ...implementsTypes];
    if (allInherits.length > 0) {
        inheritsStr = `: ${allInherits.join(', ')}`;
    }

    let properties: CodeResult[] = [];
    let methods: CodeResult[] = [];
    let initializer: CodeResult[] = [];

    members.forEach((member: ClassMemberTypes) => {
        if (Node.isPropertyDeclaration(member)) {
            const propName = member.getName();
            const propType = parseType(member.getType());
            const isPrivate = member.hasModifier(ts.SyntaxKind.PrivateKeyword);
            const isReadonly = member.hasModifier(ts.SyntaxKind.ReadonlyKeyword);
            const isStatic = member.hasModifier(ts.SyntaxKind.StaticKeyword);
            const initializer = member.getInitializer();

            let initStr = '';
            if (initializer) {
                initStr = ` = ${parseExpression(initializer).code}`;
            }

            // readonly 属性使用 let 而不是 var
            const varKeyword = isReadonly ? 'let' : 'var';
            const staticKeyword = isStatic ? 'static ' : '';
            
            // TypeScript 默认是 public，但 Swift 需要显式声明
            // 如果有 private/protected，使用对应的访问修饰符
            // 否则如果是 implements 接口的类，默认添加 public
            const isProtected = member.hasModifier(ts.SyntaxKind.ProtectedKeyword);
            const isPublic = member.hasModifier(ts.SyntaxKind.PublicKeyword);
            let accessModifier = '';
            if (isPrivate) {
                accessModifier = 'private ';
            } else if (isProtected) {
                accessModifier = 'internal '; // Swift 没有直接的 protected，使用 internal
            } else if (isPublic || implementsTypes.length > 0) {
                // 显式 public 或实现接口的类，使用 public
                accessModifier = 'public ';
            }
            
            properties.push({
                code: `${accessModifier}${staticKeyword}${varKeyword} ${propName}: ${propType}${initStr}`,
                indentLevel: 1  // class 成员需要 1 级缩进
            });
        } else if (Node.isMethodDeclaration(member)) {
            const methodName = member.getName() || '';
            const parameters = member.getParameters();
            const returnType = member.getReturnType();
            const body = member.getBody();
            const isStatic = member.hasModifier(ts.SyntaxKind.StaticKeyword);
            const isAbstract = member.hasModifier(ts.SyntaxKind.AbstractKeyword);
            const isOverride = member.hasModifier(ts.SyntaxKind.OverrideKeyword);

            const params = parameters.map((param: ParameterDeclaration) => {
                const paramName = param.getName();
                const paramType = parseType(param.getType());
                const initializer = param.getInitializer();
                
                // 处理默认参数
                let paramStr = `_ ${paramName}: ${paramType}`;
                if (initializer) {
                    const defaultVal = parseExpression(initializer).code;
                    paramStr += ` = ${defaultVal}`;
                }
                return paramStr;
            }).join(', ');

            const returnTypeStr = parseType(returnType);
            
            // abstract 方法没有方法体
            let methodCode = '';
            if (isAbstract) {
                // Swift 没有直接的 abstract，使用 protocol 或要求子类实现
                // 这里我们生成一个空实现，或者可以抛出 fatalError
                methodCode = `func ${methodName}(${params}) -> ${returnTypeStr} { fatalError("Abstract method ${methodName} not implemented") }`;
            } else {
                const bodyStr = body ? parseBlock(body as Block).code : '{}';
                methodCode = `func ${methodName}(${params}) -> ${returnTypeStr} ${bodyStr}`;
            }
            
            // 添加修饰符
            const staticKeyword = isStatic ? 'static ' : '';
            
            // 处理访问修饰符（与属性相同逻辑）
            const isMethodPrivate = member.hasModifier(ts.SyntaxKind.PrivateKeyword);
            const isMethodProtected = member.hasModifier(ts.SyntaxKind.ProtectedKeyword);
            const isMethodPublic = member.hasModifier(ts.SyntaxKind.PublicKeyword);
            let methodAccessModifier = '';
            if (isMethodPrivate) {
                methodAccessModifier = 'private ';
            } else if (isMethodProtected) {
                methodAccessModifier = 'internal ';
            } else if (isMethodPublic || implementsTypes.length > 0) {
                methodAccessModifier = 'public ';
            }
            
            // 检测是否需要 override 关键字
            // 只有当方法在父类中存在时才需要 override
            let needsOverride = isOverride;
            if (!needsOverride) {
                const parentClass = (statement as any).getExtends();
                if (parentClass) {
                    // 检查父类是否有同名方法
                    const parentClassName = parentClass.getExpression ? parentClass.getExpression().getText() : parentClass.getText();
                    // 简单判断：如果类有父类且方法名不是 init，则可能需要 override
                    // 但这不够准确，最好检查父类的方法列表
                    const parentClassDecl = parentClass.getSymbol()?.getDeclarations()?.[0];
                    if (parentClassDecl) {
                        const parentMembers = parentClassDecl.getMembers ? parentClassDecl.getMembers() : [];
                        const hasMethodInParent = parentMembers.some((m: any) => {
                            const mName = m.getName ? m.getName() : '';
                            return mName === methodName && !m.isConstructor?.();
                        });
                        needsOverride = hasMethodInParent;
                    }
                }
            }
            const overrideKeyword = needsOverride ? 'override ' : '';
            methods.push({
                code: `${methodAccessModifier}${overrideKeyword}${staticKeyword}${methodCode}`,
                indentLevel: 1  // class 成员需要 1 级缩进
            });
        } else if (Node.isConstructorDeclaration(member)) {
            const parameters = member.getParameters();
            const body = member.getBody();

            const params = parameters.map((param: ParameterDeclaration) => {
                const paramName = param.getName();
                const paramType = parseType(param.getType());
                return `_ ${paramName}: ${paramType}`;
            }).join(', ');

            const bodyStr = body ? parseBlock(body as Block).code : '{}';

            initializer.push({
                code: `init(${params}) ${bodyStr}`,
                indentLevel: 1  // class 成员需要 1 级缩进
            });
        }
    });

    // 合并所有成员，使用 2 个换行分隔
    const allMembers = [...properties, ...initializer, ...methods];
    const classBody = mergeCodeResults(allMembers, { baseIndent: 0, joinWith: '\n\n' });
    
    // 抽象类使用注释标记（Swift 没有直接的 abstract 类）
    const classKeyword = isAbstract ? '/* abstract */ class' : 'class';

    return {
        code: `${isExport ? 'public ' : ''}${classKeyword} ${name}${genericStr}${inheritsStr} {\n${classBody}\n}`,
        indentLevel: 0
    };
}

function parseInterfaceDeclaration(statement: InterfaceDeclaration): CodeResult {
    const isExport = statement.hasModifier(ts.SyntaxKind.ExportKeyword);
    const name = statement.getName() || 'AnonymousInterface';
    const members = statement.getMembers();
    
    // 获取泛型参数，转换为 Swift 的 associatedtype
    const typeParameters = statement.getTypeParameters() || [];
    const associatedTypes = typeParameters.map(tp => `associatedtype ${tp.getName()}`).join('\n    ');

    let properties: string[] = [];
    let methods: string[] = [];
    let interfaceProperties: {name: string, type: string}[] = [];

    members.forEach((member: any) => {
        if (Node.isPropertySignature(member)) {
            const propName = member.getName();
            // 获取类型
            const propTypeObj = member.getType();
            
            // 检查是否是可选属性（通过原始文本检查问号）
            const syntaxText = member.getText();
            const hasQuestionToken = syntaxText.includes('?');
            
            // 检查是否是联合类型 T | undefined
            const isUnionWithUndefined = propTypeObj.isUnion() && 
                propTypeObj.getUnionTypes().some(t => t.isUndefined());
            
            // 获取基础类型
            let propType = parseType(propTypeObj);
            
            // 如果是可选属性或联合类型 T | undefined，生成 Type?
            if (hasQuestionToken || isUnionWithUndefined) {
                // 如果是联合类型 T | undefined，去掉 Undefined 部分
                if (isUnionWithUndefined && !propType.endsWith('?')) {
                    // parseType 已经处理了联合类型，返回 T?
                    if (!propType.endsWith('?')) {
                        propType = `${propType}?`;
                    }
                } else if (!propType.endsWith('?')) {
                    propType = `${propType}?`;
                }
            }
            
            // Protocol 属性需要同时支持 get 和 set
            properties.push(`var ${propName}: ${propType} { get set }`);
            interfaceProperties.push({ name: propName, type: propType });
        } else if (Node.isMethodSignature(member)) {
            const methodName = member.getName();
            const parameters = member.getParameters();
            const returnType = member.getReturnType();

            const params = parameters.map((param: ParameterDeclaration) => {
                const paramName = param.getName();
                const paramType = parseType(param.getType());
                return `_ ${paramName}: ${paramType}`;
            }).join(', ');

            const returnTypeStr = parseType(returnType);
            methods.push(`func ${methodName}(${params}) -> ${returnTypeStr}`);
        }
    });

    const protocolBody = [...(associatedTypes ? [associatedTypes] : []), ...properties, ...methods].join('\n    ');

    // 保存 interface 的属性信息到 Map 中
    interfaceDefinitions.set(name, { name, properties: interfaceProperties });

    return {
        code: `public protocol ${name} {\n    ${protocolBody}\n}`
    };
}

function parseTypeAliasDeclaration(statement: TypeAliasDeclaration): CodeResult {
    const isExport = statement.hasModifier(ts.SyntaxKind.ExportKeyword);
    const name = statement.getName();
    const typeNode = statement.getTypeNode();

    let typeStr = '';
    if (typeNode) {
        if (Node.isTypeLiteral(typeNode)) {
            // 在 Swift 中，对象字面量类型转换为字典类型
            typeStr = '[String: Any]';
        } else {
            typeStr = parseType(statement.getType());
            // 检测循环引用：如果类型别名引用自身，使用 Any 类型
            if (typeStr === name) {
                typeStr = 'Any';
            }
            // 将 __type 替换为 Any
            if (typeStr === '__type') {
                typeStr = 'Any';
            }
        }
    }

    return {
        code: `${isExport ? 'public ' : ''}typealias ${name} = ${typeStr}`
    };
}

function parseImportDeclaration(statement: ImportDeclaration): CodeResult {
    const importClause = statement.getImportClause();
    const moduleSpecifier = statement.getModuleSpecifier();
    if (!moduleSpecifier) return {code: ''};

    const modulePath = moduleSpecifier.getLiteralText();
    const imports: string[] = [];

    // 检查被导入的模块是否在项目文件中（本地模块）
    const isLocalModule = modulePath.startsWith('./');
    
    // 处理命名导入（如 import { PI, greet } from './math'）
    if (importClause && importClause.getNamedBindings()) {
        const namedBindings = importClause.getNamedBindings()!;
        if (Node.isNamedImports(namedBindings)) {
            const elements = namedBindings.getElements();
            elements.forEach(element => {
                const name = element.getName();
                const alias = element.getAliasNode();
                const aliasName = alias ? alias.getText() : name;
                
                // 对于本地模块，生成 let aliasName = ModuleName.name 或 typealias
                if (isLocalModule) {
                    // 计算模块名：路径 + 文件名 + Module
                    const importedModuleName = getModuleNameFromPath(modulePath);
                    // 根据名称判断是类型还是值（大写开头且全大写的可能是常量）
                    // 简单规则：如果名称全大写，是常量；如果首字母大写但不全大写，是类型；否则是函数/变量
                    if (name === name.toUpperCase() && name.length > 1) {
                        // 常量（全大写）- 使用 let
                        imports.push(`let ${aliasName} = ${importedModuleName}.${name}`);
                    } else if (name.charAt(0) === name.charAt(0).toUpperCase()) {
                        // 类型（类、接口等）- 使用 typealias
                        imports.push(`typealias ${aliasName} = ${importedModuleName}.${name}`);
                    } else {
                        // 值（函数、变量）- 使用 let
                        imports.push(`let ${aliasName} = ${importedModuleName}.${name}`);
                    }
                } else {
                    // 对于外部模块，根据名称推断类型并生成声明
                    if (name.toUpperCase() === name) {
                        // 常量（大写）
                        imports.push(`let ${aliasName}: Any? = nil // Imported from ${modulePath}`);
                    } else if (name.charAt(0) === name.charAt(0).toUpperCase()) {
                        // 类（大写开头）- 生成一个带方法的类
                        imports.push(`class ${aliasName} {
    func add(_ a: Any?...) -> Any? { return nil }
    func multiply(_ a: Any?...) -> Any? { return nil }
    subscript(key: String) -> Any? { return nil }
} // Imported from ${modulePath}`);
                    } else {
                        // 函数（小写开头）
                        imports.push(`func ${aliasName}(_ args: Any?...) -> Any? { return nil } // Imported from ${modulePath}`);
                    }
                }
            });
        }
    }

    // 处理默认导入
    if (importClause && importClause.getDefaultImport()) {
        const defaultImport = importClause.getDefaultImport()!;
        const name = defaultImport.getText();
        
        // 对于本地模块，生成 let name = ModuleName.default
        if (isLocalModule) {
            const importedModuleName = getModuleNameFromPath(modulePath);
            imports.push(`let ${name} = ${importedModuleName}.default`);
        } else {
            imports.push(`let ${name}: Any? = nil // Default import from ${modulePath}`);
        }
    }

    // 处理命名空间导入（如 import * as utils）
    if (importClause && importClause.getNamespaceImport()) {
        const namespaceImport = importClause.getNamespaceImport()!;
        const name = namespaceImport.getText();
        imports.push(`let ${name} = ${getModuleNameFromPath(modulePath)}.self`);
    }

    // 处理本地模块导入
    if (isLocalModule) {
        // 对于本地模块，生成导入的别名
        if (imports.length > 0) {
            return {code: imports.join('\n')};
        }
        return {code: ''};
    }

    // 处理内置模块或第三方模块
    const moduleName = modulePath.replace(/\.ts$/, '');

    // 特殊处理 util 模块
    if (moduleName === 'util') {
        return {code: imports.length > 0 ? imports.join('\n') : ''};
    }

    // 对于其他模块，添加 Swift import 语句
    if (imports.length > 0) {
        return {code: `import ${moduleName}\n${imports.join('\n')}`};
    }
    return {code: `import ${moduleName}`};
}

function parseExpressionStatement(statement: ExpressionStatement): CodeResult {
    const expression = statement.getExpression();
    const expressionCode = parseExpression(expression).code;
    return {code: expressionCode};
}

// 从模块路径生成模块名
function getModuleNameFromPath(modulePath: string): string {
    // 移除 ./ 或 ../ 前缀
    let cleanPath = modulePath.replace(/^\.\.?\//, '');
    // 移除 .ts 扩展名
    cleanPath = cleanPath.replace(/\.ts$/, '');
    // 将 / 替换为 _
    cleanPath = cleanPath.replace(/\//g, '_');
    // 添加 _ 前缀和 Module 后缀，并将第一个字母大写
    const moduleName = '_' + cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1) + 'Module';
    return moduleName;
}

function parseIfStatement(statement: IfStatement): CodeResult {
    const condition = parseExpression(statement.getExpression()).code;
    const thenStatement = statement.getThenStatement();
    
    // 检测类型缩窄：检查条件中是否有 typeof 或 instanceof
    let narrowedVarName = '';
    let narrowedType = '';
    
    const conditionExpr = statement.getExpression();
    if (Node.isBinaryExpression(conditionExpr)) {
        const left = conditionExpr.getLeft();
        const right = conditionExpr.getRight();
        const operator = conditionExpr.getOperatorToken().getText();
        
        // 处理 typeof x === 'string' 这种情况
        if ((operator === '===' || operator === '==') && Node.isTypeOfExpression(conditionExpr.getLeft())) {
            const typeOfExpr = conditionExpr.getLeft() as any;
            const operand = typeOfExpr.getExpression();
            if (Node.isIdentifier(operand)) {
                narrowedVarName = operand.getText();
                const typeString = (right as any).getLiteralValue ? (right as any).getLiteralValue() : '';
                narrowedType = typeString;
            }
        } else if ((operator === '===' || operator === '==') && Node.isTypeOfExpression(conditionExpr.getRight())) {
            const typeOfExpr = conditionExpr.getRight() as any;
            const operand = typeOfExpr.getExpression();
            if (Node.isIdentifier(operand)) {
                narrowedVarName = operand.getText();
                const typeString = (left as any).getLiteralValue ? (left as any).getLiteralValue() : '';
                narrowedType = typeString;
            }
        }
    }
    
    let thenResult: CodeResult;
    if (Node.isBlock(thenStatement)) {
        thenResult = parseBlock(thenStatement as Block);
        // 如果有类型缩窄，在块中添加变量重命名（使用 shadowing 技术）
        if (narrowedVarName && narrowedType) {
            const swiftType = getSwiftTypeName(narrowedType);
            // 创建一个同名的新变量，覆盖原来的 Any 类型变量
            const typeCastCode = {
                code: `let ${narrowedVarName} = ${narrowedVarName} as! ${swiftType}`,
                indentLevel: 1  // 在块内，所以加 1 级缩进
            };
            // 将类型转换插入到块的开头
            thenResult = {
                code: `{\n${indentCode(typeCastCode.code, typeCastCode.indentLevel)}\n${thenResult.code.substring(2)}`,
                indentLevel: 0
            };
        }
    } else {
        const stmtResult = parseStatement(thenStatement);
        thenResult = {
            code: `{\n${indentCode(stmtResult.code, 1)}\n}`,
            indentLevel: 0
        };
    }
    
    let elseResult: CodeResult | null = null;
    const elseStatement = statement.getElseStatement();
    if (elseStatement) {
        if (Node.isBlock(elseStatement)) {
            elseResult = parseBlock(elseStatement as Block);
        } else if (Node.isIfStatement(elseStatement)) {
            elseResult = parseIfStatement(elseStatement as IfStatement);
        } else {
            const stmtResult = parseStatement(elseStatement);
            elseResult = {
                code: `{\n${indentCode(stmtResult.code, 1)}\n}`,
                indentLevel: 0
            };
        }
    }
    
    const elseStr = elseResult ? ` else ${elseResult.code}` : '';
    
    return {
        code: `if ${condition} ${thenResult.code}${elseStr}`,
        indentLevel: 0
    };
}

function parseForStatement(statement: ForStatement): CodeResult {
    const initializer = statement.getInitializer();
    const condition = statement.getCondition();
    const incrementor = statement.getIncrementor();
    const body = statement.getStatement();

    let initCode = '';
    let varName = '';
    if (initializer && Node.isVariableDeclarationList(initializer)) {
        const decls = initializer.getDeclarations();
        if (decls.length > 0) {
            const decl = decls[0];
            varName = decl.getName();
            const initializerExpr = decl.getInitializer();
            initCode = `var ${varName} = ${initializerExpr ? parseExpression(initializerExpr).code : '0'}`;
        }
    }

    let conditionCode = condition ? parseExpression(condition).code : '';
    // 移除条件中的 as! 类型断言，避免 Swift 解析错误
    conditionCode = conditionCode.replace(/\s+as!\s+\w+/g, '');
    
    // 直接处理 incrementor，不通过 parseExpression
    let incrementCode = '';
    if (incrementor) {
        if (incrementor.getKind() === ts.SyntaxKind.PostfixUnaryExpression) {
            const postfixExpr = incrementor as any;
            const operand = postfixExpr.getOperand();
            const operandCode = parseExpression(operand).code;
            const operatorToken = postfixExpr.getOperatorToken();
            // operatorToken 直接就是 token 的 kind 值（数字）
            const tokenKind = operatorToken as any;
            // ts.SyntaxKind.PlusPlusToken = 46, ts.SyntaxKind.MinusMinusToken = 47
            if (tokenKind === ts.SyntaxKind.PlusPlusToken) {
                incrementCode = `${operandCode} += Number(1)`;
            } else if (tokenKind === ts.SyntaxKind.MinusMinusToken) {
                incrementCode = `${operandCode} -= Number(1)`;
            } else {
                incrementCode = parseExpression(incrementor).code;
            }
        } else {
            incrementCode = parseExpression(incrementor).code;
        }
    }
    
    let bodyCode = '';
    if (body && Node.isBlock(body)) {
        // 将 increment 代码添加到循环体的末尾
        const blockStatements = body.getStatements().map(statement => parseStatement(statement));
        if (incrementCode) {
            blockStatements.push({ code: incrementCode, indentLevel: 0 });
        }
        const bodyResult = parseBlock(body as Block);
        // 重新构建带 increment 的块
        const allStatements = [...body.getStatements().map(s => parseStatement(s))];
        if (incrementCode) {
            allStatements.push({ code: incrementCode, indentLevel: 0 });
        }
        const mergedBody = mergeCodeResults(allStatements, { baseIndent: 1, joinWith: '\n' });
        bodyCode = `{\n${mergedBody}\n}`;
    } else if (body) {
        const stmtResult = parseStatement(body);
        bodyCode = `{\n${indentCode(stmtResult.code, 1)}${incrementCode ? '\n    ' + incrementCode : ''}\n}`;
    } else {
        bodyCode = `{${incrementCode ? ' ' + incrementCode + ' ' : ''}}`;
    }
    
    // Swift 不支持 C 风格的 for 循环，使用 while 循环替代
    // 将初始化代码和 while 循环包装到一个 do 块中，避免变量污染外部作用域
    return {
        code: `do {\n${indentCode(initCode, 1)}\n${indentCode(`while ${conditionCode} ${bodyCode}`, 1)}\n}`,
        indentLevel: 0
    };
}

function parseWhileStatement(statement: WhileStatement): CodeResult {
    const condition = parseExpression(statement.getExpression()).code;
    const body = statement.getStatement();
    
    let bodyCode = '';
    if (body && Node.isBlock(body)) {
        const bodyResult = parseBlock(body as Block);
        bodyCode = bodyResult.code;
    } else if (body) {
        const stmtResult = parseStatement(body);
        bodyCode = `{\n${indentCode(stmtResult.code, 1)}\n}`;
    } else {
        bodyCode = '{}';
    }
    
    // 移除条件中的 as! 类型断言，避免 Swift 解析错误
    const cleanCondition = condition.replace(/\s+as!\s+\w+/g, '');
    
    return {
        code: `while ${cleanCondition} ${bodyCode}`,
        indentLevel: 0
    };
}

function parseDoWhileStatement(statement: DoStatement): CodeResult {
    const condition = parseExpression(statement.getExpression()).code;
    const body = statement.getStatement();
    
    let bodyCode = '';
    if (body && Node.isBlock(body)) {
        const bodyResult = parseBlock(body as Block);
        bodyCode = bodyResult.code;
    } else if (body) {
        const stmtResult = parseStatement(body);
        bodyCode = `{\n${indentCode(stmtResult.code, 1)}\n}`;
    } else {
        bodyCode = '{}';
    }
    
    // 移除条件中的 as! 类型断言，避免 Swift 解析错误
    const cleanCondition = condition.replace(/\s+as!\s+\w+/g, '');
    
    // Swift 使用 repeat-while 语法
    return {
        code: `repeat ${bodyCode} while ${cleanCondition}`,
        indentLevel: 0
    };
}

function parseSwitchStatement(statement: SwitchStatement): CodeResult {
    const expression = parseExpression(statement.getExpression()).code;
    const clauses = statement.getCaseBlock().getClauses();
    
    let switchCode = `switch ${expression} {\n`;
    
    for (const clause of clauses) {
        if (Node.isCaseClause(clause)) {
            const caseValue = parseExpression(clause.getExpression()).code;
            const statements = clause.getStatements().map(s => parseStatement(s));
            const caseBody = mergeCodeResults(statements, { baseIndent: 1, joinWith: '\n' });
            switchCode += `case ${caseValue}:\n${caseBody}\n`;
        } else if (Node.isDefaultClause(clause)) {
            const statements = clause.getStatements().map(s => parseStatement(s));
            const defaultBody = mergeCodeResults(statements, { baseIndent: 1, joinWith: '\n' });
            switchCode += `default:\n${defaultBody}\n`;
        }
    }
    
    switchCode += '}';
    return {
        code: switchCode,
        indentLevel: 0
    };
}

function parseTryStatement(statement: TryStatement): CodeResult {
    const tryBlock = statement.getTryBlock();
    const catchClause = statement.getCatchClause();
    const finallyBlock = statement.getFinallyBlock();
    
    const tryStatements = tryBlock.getStatements().map(s => parseStatement(s));
    const tryBody = mergeCodeResults(tryStatements, { baseIndent: 1, joinWith: '\n' });
    let tryCode = `do {\n${tryBody}\n}`;
    
    // 处理 catch
    if (catchClause) {
        const catchVar = catchClause.getVariableDeclaration();
        const catchBlock = catchClause.getBlock();
        
        let catchHeader = ' catch {';
        if (catchVar) {
            const varName = catchVar.getName();
            catchHeader = ` catch {\n${indentCode(`let ${varName} = error`, 1)}\n`;
        }
        
        const catchStatements = catchBlock.getStatements().map(s => parseStatement(s));
        const catchBody = mergeCodeResults(catchStatements, { baseIndent: 1, joinWith: '\n' });
        tryCode += `${catchHeader}${catchBody}\n}`;
    }
    
    // 处理 finally - Swift 没有 finally，使用 defer 模拟
    if (finallyBlock) {
        // 将 finally 块包装在 defer 中，放在 try-catch 之前
        const finallyStatements = finallyBlock.getStatements().map(s => parseStatement(s));
        const finallyBody = mergeCodeResults(finallyStatements, { baseIndent: 1, joinWith: '\n' });
        const deferCode = `defer {\n${finallyBody}\n}\n`;
        // 将 defer 放在 try-catch 之前
        tryCode = deferCode + tryCode;
    }
    
    return {
        code: tryCode,
        indentLevel: 0
    };
}

function parseForOfStatement(statement: ForOfStatement): CodeResult {
    const initializer = statement.getInitializer();
    const expression = statement.getExpression();
    const body = statement.getStatement();
    
    if (!initializer || !expression) {
        return {code: ''};
    }
    
    let varName = '';
    // 从 initializer (VariableDeclarationList) 获取变量名
    const decls = initializer.getDeclarations();
    if (decls.length > 0) {
        varName = decls[0].getName();
    }
    
    if (!varName) {
        return {code: ''};
    }
    
    const exprCode = parseExpression(expression).code;
    
    let bodyCode = '';
    if (body && Node.isBlock(body)) {
        const bodyResult = parseBlock(body as Block);
        bodyCode = bodyResult.code;
    } else if (body) {
        const stmtResult = parseStatement(body);
        bodyCode = `{\n${indentCode(stmtResult.code, 1)}\n}`;
    } else {
        bodyCode = '{}';
    }
    
    // Swift 的 for-in 循环语法：for item in collection { }
    return {
        code: `for ${varName} in ${exprCode} ${bodyCode}`,
        indentLevel: 0
    };
}

function parseForInStatement(statement: ForInStatement): CodeResult {
    const initializer = statement.getInitializer();
    const expression = statement.getExpression();
    const body = statement.getStatement();
    
    if (!initializer || !expression) {
        return {code: ''};
    }
    
    let varName = '';
    // 从 initializer (VariableDeclarationList) 获取变量名
    const decls = initializer.getDeclarations();
    if (decls.length > 0) {
        varName = decls[0].getName();
    }
    
    if (!varName) {
        return {code: ''};
    }
    
    const exprCode = parseExpression(expression).code;
    
    let bodyCode = '';
    if (body && Node.isBlock(body)) {
        const bodyResult = parseBlock(body as Block);
        bodyCode = bodyResult.code;
    } else if (body) {
        const stmtResult = parseStatement(body);
        bodyCode = `{\n${indentCode(stmtResult.code, 1)}\n}`;
    } else {
        bodyCode = '{}';
    }
    
    // for...in 循环遍历对象的键，需要使用 Object.keys() 方法
    // Swift 的 for-in 循环语法：for key in Object.keys(object) { }
    return {
        code: `for ${varName} in Object.keys(${exprCode}) ${bodyCode}`,
        indentLevel: 0
    };
}


function parseExpression(expression?: Expression): CodeResult {
    if (!expression) {
        return {code: 'Undefined()'};
    }

    // 处理 await 表达式
    if (expression.getKind() === ts.SyntaxKind.AwaitExpression) {
        // await 表达式已经被 transformAsyncBody 处理为 Promise 链
        // 这里只需要返回内部的表达式
        const awaitExpr = expression as any;
        const expr = awaitExpr.getExpression ? awaitExpr.getExpression() : null;
        return parseExpression(expr);
    }

    if (Node.isIdentifier(expression)) {
        const idText = expression.getText();
        if (idText === 'null') {
            return {code: 'Null()'};
        } else if (idText === 'undefined') {
            return {code: 'Undefined()'};
        }
        
        // 检查类型收窄
        const currentType = expression.getType();
        const targetType = checkTypeNarrowing(expression, currentType);
        
        if (targetType) {
            // 类型收窄了，添加 as! 转换
            return {code: `${idText} as! ${targetType}`};
        }
        
        return {code: idText};
    } else if (expression.getKind() === ts.SyntaxKind.NullKeyword) {
        return {code: 'Null()'};
    } else if (expression.getKind() === ts.SyntaxKind.UndefinedKeyword) {
        return {code: 'Undefined()'};
    } else if (Node.isStringLiteral(expression)) {
        // 获取字符串文本并正确转义
        const text = expression.getLiteralValue();
        // 转义特殊字符
        const escaped = text
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return {code: `"${escaped}"`};
    } else if (Node.isNoSubstitutionTemplateLiteral(expression)) {
        // 处理不带变量的模板字符串（反引号字符串）
        const text = expression.getLiteralValue();
        const escaped = text
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return {code: `"${escaped}"`};
    } else if (expression.getKind() === ts.SyntaxKind.PostfixUnaryExpression) {
        // 处理 ++ 和 -- 运算符（Swift 不支持，转换为 += 1 或 -= 1）
        const operand = (expression as PostfixUnaryExpression).getOperand();
        const operandCode = parseExpression(operand).code;
        // operatorToken 直接就是 token 的 kind 值（数字）
        const tokenKind = (expression as PostfixUnaryExpression).getOperatorToken();
        // ts.SyntaxKind.PlusPlusToken = 46, ts.SyntaxKind.MinusMinusToken = 47
        if (tokenKind === ts.SyntaxKind.PlusPlusToken) {
            return {code: `${operandCode} += Number(1)`};
        } else if (tokenKind === ts.SyntaxKind.MinusMinusToken) {
            return {code: `${operandCode} -= Number(1)`};
        }
        return {code: operandCode};
    } else if (Node.isNonNullExpression(expression)) {
        // 处理非空断言运算符 (!) - TypeScript 4.0+
        // 生成运行时断言检查
        const expr = (expression as any).getExpression();
        const exprCode = parseExpression(expr).code;
        
        // 获取表达式的类型
        const exprType = expression.getType();
        let returnType = 'Any';
        if (exprType.isString() || exprType.isStringLiteral()) {
            returnType = 'String';
        } else if (exprType.isNumber() || exprType.isNumberLiteral()) {
            returnType = 'Number';
        } else if (exprType.isBoolean() || exprType.isBooleanLiteral()) {
            returnType = 'Bool';
        }
        
        // 添加断言：如果值为 Undefined，抛出错误
        return {code: `({ () -> ${returnType} in
    let __value = ${exprCode}
    if __value == Undefined() {
        fatalError("Cannot access property of undefined/null")
    }
    return __value as! ${returnType}
}())`};
    } else if (Node.isBigIntLiteral(expression)) {
        // bigint 字面量（以 n 结尾），如 123n
        const literalText = expression.getText();
        // 移除 n 后缀并转换为 BigInt
        const value = literalText.slice(0, -1);
        return {code: `BigInt(${value})`};
    } else if (Node.isNumericLiteral(expression)) {
        // 普通数字字面量
        const literalValue = expression.getLiteralValue();
        return {code: `Number(${literalValue})`};
    } else if (expression.getKind() === ts.SyntaxKind.TrueKeyword || expression.getKind() === ts.SyntaxKind.FalseKeyword) {
        return {code: expression.getText()};
    } else if (Node.isBinaryExpression(expression)) {
        const left = parseExpression(expression.getLeft()).code;
        const right = parseExpression(expression.getRight()).code;
        const operator = expression.getOperatorToken().getText();

        // 处理一些特殊运算符
        let swiftOperator = operator;
        if (operator === '??') {
            // 空值合并运算符，直接使用 Swift 的 ??
            // TypeScript 会保证类型安全
            return {code: `${left} ?? ${right}`};
        } else if (operator === 'instanceof') {
            // instanceof 检查
            return {code: `${left} is ${right}`};
        }
        
        // 如果左边或右边包含 getTypeName 调用（来自 typeof），使用 == 而不是 ===
        if ((operator === '===' || operator === '==') && 
            (left.includes('getTypeName') || right.includes('getTypeName'))) {
            swiftOperator = '==';
        }

        return {code: `${left} ${swiftOperator} ${right}`};
    } else if (Node.isNewExpression(expression)) {
        // 处理 new 表达式，在 Swift 中不需要 new 关键字
        const expressionPart = parseExpression(expression.getExpression()).code;
        const argsList = expression.getArguments();
        
        // 特殊处理 RegExp 构造函数
        if (expressionPart === 'RegExp') {
            const pattern = argsList.length > 0 ? parseExpression(argsList[0] as Expression).code : '""';
            const flags = argsList.length > 1 ? parseExpression(argsList[1] as Expression).code : '""';
            return {code: `RegExp(${pattern}, flags: ${flags})`};
        }
        
        // 特殊处理 Promise 构造函数，保留泛型参数
        if (expressionPart.startsWith('Promise')) {
            // 获取泛型参数
            const typeArgs = (expression as any).getTypeArguments ? (expression as any).getTypeArguments() : [];
            let genericParams = '';
            if (typeArgs && typeArgs.length > 0) {
                // 尝试获取类型的文本表示
                const typeArgCodes = typeArgs.map((t: any) => {
                    // 尝试使用 getText() 方法
                    if (t.getText) {
                        const text = t.getText();
                        // 转换为 Swift 类型
                        if (text === 'string') return 'String';
                        if (text === 'number') return 'Number';
                        if (text === 'boolean') return 'Bool';
                        if (text === 'void') return 'Void';
                        return text;
                    }
                    return 'Any';
                }).join(', ');
                genericParams = `<${typeArgCodes}>`;
            }
            const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
            // 使用泛型参数
            return {code: `Promise${genericParams}(${args})`};
        }
        
        const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
        // 移除泛型参数，Swift 会自动推断
        const cleanedExpression = expressionPart.replace(/<[^>]+>/g, '');
        return {code: `${cleanedExpression}(${args})`};
    } else if (Node.isConditionalExpression(expression)) {
        // 处理三元运算符：condition ? whenTrue : whenFalse
        const condition = parseExpression(expression.getCondition()).code;
        const whenTrue = parseExpression(expression.getWhenTrue()).code;
        const whenFalse = parseExpression(expression.getWhenFalse()).code;
        return {code: `${condition} ? ${whenTrue} : ${whenFalse}`};
    } else if (Node.isTypeOfExpression(expression)) {
        // 处理 typeof 操作符
        const operand = parseExpression(expression.getExpression()).code;
        // 使用 Swift 的 Mirror 来获取运行时类型
        return {code: `getTypeName(of: ${operand})`};
    } else if (expression.getKind() === ts.SyntaxKind.RegularExpressionLiteral) {
        // 处理正则表达式字面量，如 /[.]*/
        const regexText = expression.getText();
        // 移除两边的斜杠，提取正则表达式内容
        // 格式：/pattern/flags
        const match = regexText.match(/^\/(.*)\/([gimsuy]*)$/);
        if (match) {
            const pattern = match[1];
            const flags = match[2] || '';
            // 转换为 Swift 的 RegExp 对象
            return {code: `RegExp("${pattern}", flags: "${flags}")`};
        }
        // 如果格式不对，返回原始文本
        return {code: regexText};
    } else if (Node.isBlock(expression)) {
        // 处理块状表达式（单独的代码块）
        const blockResult = parseBlock(expression as Block);
        // 块状表达式在 Swift 中可以直接使用 do 块
        return {code: `do ${blockResult.code}`};
    } else if (Node.isCallExpression(expression)) {
        const callee = expression.getExpression();
        const argsList = expression.getArguments();
        
        // 处理字符串方法调用
        if (Node.isPropertyAccessExpression(callee)) {
            const methodName = callee.getName();
            const obj = callee.getExpression();
            const objType = obj.getType();
            
            // 如果是字符串方法，转换为 Swift 方法
            if (objType.isString() || objType.isStringLiteral()) {
                const objCode = parseExpression(obj).code;
                if (methodName === 'toUpperCase') {
                    return {code: `(${objCode}).uppercased()`};
                } else if (methodName === 'toLowerCase') {
                    return {code: `(${objCode}).lowercased()`};
                }
            }
        }
        
        // 检测是否是数组方法调用
        if (Node.isPropertyAccessExpression(callee)) {
            const arrayObj = parseExpression(callee.getExpression()).code;
            const methodName = callee.getName();
            
            // 数组方法映射
            const arrayMethodMap: { [key: string]: string } = {
                'push': 'push',
                'pop': 'pop',
                'shift': 'shift',
                'unshift': 'unshift',
                'slice': 'slice',
                'concat': 'concat',
                'includes': 'includes',
                'find': 'find',
                'findIndex': 'findIndex',
                'every': 'every',
                'some': 'some',
                'reverse': 'reverse',
                'sort': 'sort',
                'join': 'join',
                'indexOf': 'firstIndex'
            };
            
            // 使用 hasOwnProperty 检查，避免原型链上的 toString 等方法被匹配
            if (arrayMethodMap.hasOwnProperty(methodName)) {
                const swiftMethodName = arrayMethodMap[methodName];
                
                // reduce 特殊处理（参数顺序相反）
                if (methodName === 'reduce') {
                    const [fn, initial] = argsList;
                    const fnCode = parseExpression(fn as Expression).code;
                    const initialCode = parseExpression(initial as Expression).code;
                    return {code: `${arrayObj}.reduceES6(${fnCode}, ${initialCode})`};
                }
                
                // slice 参数转换为 Int
                if (methodName === 'slice') {
                    const args = argsList.map(arg => {
                        const code = parseExpression(arg as Expression).code;
                        // 将 Number(x) 转换为 Int(x.value)
                        if (code.startsWith('Number(')) {
                            return `Int(${code}.value)`;
                        }
                        return code;
                    }).join(', ');
                    return {code: `${arrayObj}.${swiftMethodName}(${args})`};
                }
                
                const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
                return {code: `${arrayObj}.${swiftMethodName}(${args})`};
            }
        }
        
        const calleeCode = parseExpression(callee).code;
        
        // 处理 Symbol() 调用，转换为 CreateSymbol()
        if (calleeCode === 'Symbol') {
            const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
            return {code: `CreateSymbol(${args})`};
        }
        
        // 处理 setTimeout 调用（保持与 TypeScript 一致的参数顺序）
        if (calleeCode === 'setTimeout') {
            const [callback, delay] = argsList;
            const callbackCode = parseExpression(callback as Expression).code;
            const delayCode = parseExpression(delay as Expression).code;
            // 将 Number 转换为 TimeInterval (Double)
            let delayValue = delayCode;
            if (delayCode && delayCode.startsWith('Number(')) {
                delayValue = `${delayCode}.value`;
            }
            return {code: `setTimeout(${callbackCode}, ${delayValue})`};
        }
        
        // 处理 queueMicrotask 调用
        if (calleeCode === 'queueMicrotask') {
            const [task] = argsList;
            const taskCode = parseExpression(task as Expression).code;
            return {code: `queueMicrotask(${taskCode})`};
        }
        
        // 处理 Promise 静态方法调用
        if (calleeCode === 'Promise.resolve' || calleeCode === 'Promise.reject' || 
            calleeCode === 'Promise.all' || calleeCode === 'Promise.race') {
            const methodName = calleeCode.split('.')[1];
            const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
            
            // 对于 Promise.all 和 Promise.race，需要保留泛型参数
            if (methodName === 'all' || methodName === 'race') {
                // 获取泛型参数（如果有）
                const typeArgs = (expression as any).getTypeArguments ? (expression as any).getTypeArguments() : [];
                if (typeArgs && typeArgs.length > 0) {
                    const typeArgCodes = typeArgs.map((t: any) => {
                        if (t.getText) {
                            const text = t.getText();
                            if (text === 'void') return 'Void';
                            if (text === 'string') return 'String';
                            if (text === 'number') return 'Number';
                            if (text === 'boolean') return 'Bool';
                            return text;
                        }
                        return 'Any';
                    }).join(', ');
                    return {code: `Promise.${methodName}<${typeArgCodes}>(${args})`};
                }
            }
            
            // 对于无参数的 Promise.resolve()，使用 resolved() 避免重载冲突
            if (methodName === 'resolve' && args.length === 0) {
                return {code: `Promise<Void>.resolved()`};
            }
            
            return {code: `Promise.${methodName}(${args})`};
        }
        
        // 处理 Promise.then 调用
        if (Node.isPropertyAccessExpression(callee)) {
            const methodName = callee.getName();
            const objCode = parseExpression(callee.getExpression()).code;
            
            if (methodName === 'then') {
                // TypeScript: promise.then(onFulfilled, onRejected)
                // Swift: promise.then(onFulfilled: { ... }, onRejected: { ... })
                const [onFulfilled, onRejected] = argsList;
                let thenCode = `${objCode}.then(`;
                let hasOnFulfilled = false;
                let hasOnRejected = false;
                
                if (onFulfilled) {
                    const onFulfilledCode = parseExpression(onFulfilled as Expression).code;
                    thenCode += `onFulfilled: ${onFulfilledCode}`;
                    hasOnFulfilled = true;
                }
                
                if (onRejected) {
                    if (hasOnFulfilled) {
                        thenCode += `, `;
                    }
                    const onRejectedCode = parseExpression(onRejected as Expression).code;
                    thenCode += `onRejected: ${onRejectedCode}`;
                    hasOnRejected = true;
                }
                
                thenCode += ')';
                return {code: thenCode};
            }
            
            if (methodName === 'catchVoid') {
                const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
                return {code: `${objCode}.catchVoid(${args})`};
            }
            
            if (methodName === 'finally') {
                const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
                return {code: `${objCode}.finally(${args})`};
            }
            
            if (methodName === 'catch') {
                const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
                return {code: `${objCode}.catch(${args})`};
            }
        }
        
        // 处理函数调用，不使用参数标签（Swift 5.3+ 支持省略参数标签）
        const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
        return {code: `${calleeCode}(${args})`};
    } else if (Node.isPropertyAccessExpression(expression)) {
        let object = parseExpression(expression.getExpression()).code;
        const property = expression.getName();
        
        // 替换 this 为 self
        if (object === 'this') {
            object = 'self';
        }
        
        // 处理 Object 的静态方法
        if (object === 'Object') {
            if (property === 'keys' || property === 'values' || property === 'hasOwnProperty') {
                // 返回静态方法引用，参数由 CallExpression 处理
                return {code: `Object.${property}`};
            }
        }
        
        // 检查是否是可选链访问（?.）
        // 通过检查源代码文本是否包含 ?.
        const syntaxText = expression.getFullText();
        const isOptionalChain = syntaxText.includes('?.');
        
        // 数组 length 转换为 count
        if (property === 'length') {
            // 如果是可选链，需要生成包装函数处理类型转换和可选
            if (isOptionalChain) {
                // 获取 .length 的类型（number）
                const lengthType = expression.getType();
                let returnType = 'Number';
                if (lengthType.isNumber() || lengthType.isNumberLiteral()) {
                    returnType = 'Number';
                }
                
                // 生成包装函数，将 Int? 转换为 Number?
                return {code: `({ () -> ${returnType}? in
    if let str = ${object} {
        return Number(str.count)
    }
    return nil
}())`};
            }
            return {code: `${object}.count`};
        }
        
        // 对于对象字面量的属性访问（AnonymousObject_*）或可选链，直接生成 Swift 的可选链
        if (object.startsWith('AnonymousObject_') || isOptionalChain) {
            // 获取属性的 TypeScript 类型
            const propTypeObj = expression.getType();
            let returnType = 'Any';
            if (propTypeObj.isString() || propTypeObj.isStringLiteral()) {
                returnType = 'String';
            } else if (propTypeObj.isNumber() || propTypeObj.isNumberLiteral()) {
                returnType = 'Number';
            } else if (propTypeObj.isBoolean() || propTypeObj.isBooleanLiteral()) {
                returnType = 'Bool';
            }
            
            // 直接生成 Swift 的可选链访问
            const accessOp = isOptionalChain ? '?.' : '.';
            return {code: `${object}${accessOp}${property} as? ${returnType}`};
        }
        
        // 使用点号访问，而不是下标
        return {code: `${object}.${property}`};
    } else if (Node.isElementAccessExpression(expression)) {
        const object = parseExpression(expression.getExpression()).code;
        const index = parseExpression(expression.getArgumentExpression()).code;
        return {code: `${object}[${index}]`};
    } else if (Node.isArrowFunction(expression)) {
        const isAsync = expression.hasModifier(ts.SyntaxKind.AsyncKeyword);
        const parameters = expression.getParameters().map(param => {
            const paramName = param.getName();
            const paramType = parseType(param.getType());
            // 添加类型注解
            return `${paramName}: ${paramType}`;
        }).join(', ');

        // 处理 async 函数的返回类型
        let returnType = parseType(expression.getReturnType());
        if (isAsync && !returnType.startsWith('Promise')) {
            if (returnType === 'Void') {
                returnType = 'Promise<Void>';
            } else {
                returnType = `Promise<${returnType}>`;
            }
        }
        
        const body = expression.getBody();

        let bodyCode = '';
        if (Node.isBlock(body)) {
            // 对于闭包的 Block，获取内部语句（单行）
            const statements = body.getStatements()
                .map(statement => parseStatement(statement).code.trim())
                .join('\n    ');
            bodyCode = statements;
        } else {
            bodyCode = parseExpression(body as Expression).code;
        }

        // 添加 async 关键字（在闭包中不需要反引号）
        // TypeScript 的 async 箭头函数编译后返回 Promise，不需要 Swift 的 async 关键字
        const asyncKeyword = '';
        return {code: `{ ${asyncKeyword}(${parameters}) -> ${returnType} in\n    ${bodyCode}\n}`};
    } else if (Node.isFunctionExpression(expression)) {
        // 处理函数表达式，转换为 Swift 闭包
        const parameters = expression.getParameters().map(param => {
            const paramName = param.getName();
            // 对于某些情况（如 Promise executor），不添加类型标注，让 Swift 推断
            return `${paramName}`;
        }).join(', ');

        const returnType = parseType(expression.getReturnType());
        const body = expression.getBody();

        let bodyCode = '';
        if (body && Node.isBlock(body)) {
            // 对于闭包的 Block，获取内部语句
            const statements = body.getStatements()
                .map(statement => parseStatement(statement).code.trim())
                .join('\n    ');
            bodyCode = statements;
        } else if (body) {
            bodyCode = parseExpression(body as Expression).code;
        }

        return {code: `{ (${parameters}) -> ${returnType} in\n    ${bodyCode}\n}`};
    } else if (Node.isArrayLiteralExpression(expression)) {
        const elements = expression.getElements().map(element => parseExpression(element).code).join(', ');
        return {code: `[${elements}]`};
    } else if (Node.isObjectLiteralExpression(expression)) {
        // 对象字面量在变量声明中已经被处理，这里处理其他情况
        // 对于非 Object 类型的对象字面量，暂时返回空对象
        const properties = expression.getProperties().map((property: any) => {
            if (Node.isPropertyAssignment(property)) {
                const name = property.getName();
                const value = parseExpression(property.getInitializer()).code;
                return `"${name}": ${value}`;
            }
            return '';
        }).filter(Boolean).join(', ');
        return {code: `Object([${properties}])`};
    } else if (Node.isTemplateExpression(expression)) {
        const head = expression.getHead().getLiteralText();
        const spans = expression.getTemplateSpans();

        // 使用 Swift 的字符串插值
        let swiftString = '"';
        // 处理头部，转义特殊字符
        swiftString += head
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        spans.forEach((span) => {
            const expressionCode = parseExpression(span.getExpression()).code;
            const literal = span.getLiteral().getLiteralText();
            swiftString += `\\(${expressionCode})`;
            // 处理每个 span 后的文本
            swiftString += literal
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
        });
        swiftString += '"';

        return {code: swiftString};
    } else if (Node.isNoSubstitutionTemplateLiteral(expression)) {
        // 处理没有插值的模板字符串（单行或多行）
        const text = expression.getLiteralText();
        const escaped = text
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return {code: `"${escaped}"`};
    } else if (Node.isTypeOfExpression(expression)) {
        const expr = parseExpression(expression.getExpression()).code;
        return {code: `String(describing: type(of: ${expr}))`};
    } else if (Node.isParenthesizedExpression(expression)) {
        const innerExpr = parseExpression(expression.getExpression()).code;
        return {code: `(${innerExpr})`};
    } else if (Node.isAsExpression(expression)) {
        const expr = parseExpression(expression.getExpression()).code;
        const typeNode = expression.getTypeNode();
        const typeName = typeNode ? typeNode.getText() : 'Any';
        // 将 TypeScript 类型转换为 Swift 类型
        let swiftType = typeName;
        if (typeName === 'any') {
            swiftType = 'Object';
        } else if (typeName === 'string') {
            swiftType = 'String';
        } else if (typeName === 'number') {
            swiftType = 'Number';
        } else if (typeName === 'boolean') {
            swiftType = 'Bool';
        }
        return {code: `${expr} as! ${swiftType}`};
    }

    return {code: expression.getText()};
}

function parseReturnStatement(statement: ReturnStatement): CodeResult {
    const expression = statement.getExpression();
    const expressionCode = expression ? parseExpression(expression).code : '';
    return {code: `return ${expressionCode}`};
}

function parseExportAssignment(statement: ExportAssignment): CodeResult {
    const expression = statement.getExpression();
    console.log(`parseExportAssignment: ${expression.getText()}`);
    // 检查是否是函数表达式（export default function）
    if (Node.isFunctionExpression(expression) || Node.isArrowFunction(expression)) {
        // 使用 parseExpression 处理函数表达式
        const functionCode = parseExpression(expression).code;
        console.log(`parseExportAssignment (function expression): ${functionCode}`);
        return {code: `public let G_default = ${functionCode}`};
    }
    // 检查是否是函数声明或类声明（export function/class）
    // TypeScript 有时会将 export function 解析为 ExportAssignment
    const declaration = expression.getDescendants().find(d => Node.isFunctionDeclaration(d) || Node.isClassDeclaration(d));
    if (declaration && Node.isFunctionDeclaration(declaration)) {
        // 提取函数名
        const funcDecl = declaration as FunctionDeclaration;
        const funcName = funcDecl.getName() || 'main';
        const result = parseFunctionDeclaration(funcDecl);
        console.log(`parseExportAssignment (function declaration): ${result.code}, name=${funcName}`);
        // 修改返回的代码，添加 G_default 标记
        return {code: result.code + ' // G_default=' + funcName};
    }
    if (declaration && Node.isClassDeclaration(declaration)) {
        return parseClassDeclaration(declaration);
    }
    const expressionCode = parseExpression(expression).code;
    console.log(`parseExportAssignment (expression): ${expressionCode}`);
    return {code: `public let G_default = ${expressionCode}`};
}

function parseEnumDeclaration(statement: any): CodeResult {
    const isExport = statement.hasModifier(ts.SyntaxKind.ExportKeyword);
    const name = statement.getName();
    const members = statement.getMembers();

    let enumMembers: string[] = [];
    members.forEach((member: any) => {
        const memberName = member.getName();
        enumMembers.push(`case ${memberName}`);
    });

    const enumBody = enumMembers.join('\n');

    return {
        code: `${isExport ? 'public ' : ''}enum ${name} {\n${enumBody}\n}`
    };
}


function parseBlock(block: Block): CodeResult {
    const statements = block.getStatements()
        .map(statement => parseStatement(statement));
    
    // 合并所有语句，每个语句在块内增加 1 级缩进
    const bodyCode = mergeCodeResults(statements, { baseIndent: 1, joinWith: '\n' });
    
    return {
        code: `{\n${bodyCode}\n}`,
        indentLevel: 0  // 块本身的缩进由调用者决定
    };
}

function parseNode(node: Node): CodeResult {
    if (Node.isImportDeclaration(node)) {
        return parseImportDeclaration(node);
    } else if (Node.isFunctionDeclaration(node)) {
        return parseFunctionDeclaration(node);
    } else if (Node.isClassDeclaration(node)) {
        return parseClassDeclaration(node);
    } else if (Node.isInterfaceDeclaration(node)) {
        return parseInterfaceDeclaration(node);
    } else if (Node.isTypeAliasDeclaration(node)) {
        return parseTypeAliasDeclaration(node);
    } else if (Node.isEnumDeclaration(node)) {
        return parseEnumDeclaration(node);
    } else if (Node.isVariableStatement(node)) {
        return parseVariableStatement(node as VariableStatement);
    } else if (Node.isExpressionStatement(node)) {
        return parseExpressionStatement(node as ExpressionStatement);
    } else if (Node.isIfStatement(node)) {
        return parseIfStatement(node as IfStatement);
    } else if (Node.isForStatement(node)) {
        return parseForStatement(node as ForStatement);
    } else if (Node.isForOfStatement(node)) {
        return parseForOfStatement(node as ForOfStatement);
    } else if (Node.isForInStatement(node)) {
        return parseForInStatement(node as ForInStatement);
    } else if (Node.isWhileStatement(node)) {
        return parseWhileStatement(node as WhileStatement);
    } else if (Node.isReturnStatement(node)) {
        return parseReturnStatement(node as ReturnStatement);
    } else if (Node.isExportAssignment(node)) {
        return parseExportAssignment(node as ExportAssignment);
    } else if (Node.isExpression(node)) {
        return parseExpression(node);
    } else if (Node.isStatement(node)) {
        return parseStatement(node as Statement);
    }
    return {code: ''};
}

function parseTypeNode(typeNode: any): string {
    // 处理条件类型（T extends U ? X : Y）
    if (typeNode.kind === ts.SyntaxKind.ConditionalType || (typeNode.getKindName && typeNode.getKindName() === 'ConditionalType')) {
        // Swift 没有直接的条件类型，转换为 Any
        return 'Any';
    }
    
    // 处理联合类型（如 number | undefined）
    if (typeNode.kind === ts.SyntaxKind.UnionType || (typeNode.getKindName && typeNode.getKindName() === 'UnionType')) {
        // 尝试使用 getTypes 方法获取联合类型的各个成员
        if (typeof typeNode.getTypes === 'function') {
            const types = typeNode.getTypes();
            if (types && types.length > 0) {
                // 检查是否是 T | undefined 或 T | null 的形式
                const nonUndefinedTypes = types.filter((t: any) => {
                    const typeName = t.getText();
                    return typeName !== 'undefined' && typeName !== 'null';
                });
                
                if (nonUndefinedTypes.length === 1) {
                    // 只有一个实际类型，其他都是 undefined/null，返回可选类型
                    const actualType = parseTypeNode(nonUndefinedTypes[0]);
                    // 如果已经是 Any，不需要再添加可选标记
                    if (actualType === 'Any') {
                        return 'Any';
                    }
                    return actualType + '?';
                } else if (nonUndefinedTypes.length === 0) {
                    // 所有类型都是 undefined/null，返回 Any?
                    return 'Any?';
                } else {
                    // 多个实际类型的联合，统一转为 Any
                    return 'Any';
                }
            }
        }
        // 无法解析 getTypes，统一转为 Any
        return 'Any';
    }
    
    // 尝试使用 getTypes 方法（联合类型）
    if (typeof typeNode.getTypes === 'function') {
        const types = typeNode.getTypes();
        if (types && types.length > 0) {
            // 这是联合类型，返回 Any
            return 'Any';
        }
    }
    
    const typeName = typeNode.getText();
    // 处理 readonly 数组/元组
    if (typeName.startsWith('readonly ')) {
        // 移除 readonly 前缀，按普通数组/元组处理
        const innerTypeName = typeName.substring(9); // 'readonly '.length = 9
        // 递归调用，但不带 readonly
        return parseTypeNode({ getText: () => innerTypeName, kind: typeNode.kind });
    }
    // 处理基本类型
    if (typeName === 'string') return 'String';
    if (typeName === 'number') return 'Number';
    if (typeName === 'boolean') return 'Bool';
    if (typeName === 'any') return 'Any';
    if (typeName === 'Object') return 'Object';
    if (typeName === 'void') return 'Void';
    if (typeName === 'null') return 'Any';
    if (typeName === 'undefined') return 'Any';
    if (typeName === 'Symbol') return 'Symbol';
    if (typeName === 'bigint') return 'BigInt';
    // 处理元组类型 - 检查是否是 [type1, type2, ...] 格式
    if (typeName.startsWith('[') && typeName.endsWith(']') && typeName.includes(',')) {
        // 移除方括号并分割类型
        const innerTypes = typeName.slice(1, -1).split(',').map(t => t.trim());
        const swiftTypes = innerTypes.map(t => {
            if (t === 'string') return 'String';
            if (t === 'number') return 'Number';
            if (t === 'boolean') return 'Bool';
            if (t === 'any') return 'Any';
            return t;
        });
        return `(${swiftTypes.join(', ')})`;
    }
    // 处理数组类型 - 检查是否以 [] 结尾
    if (typeName.endsWith('[]')) {
        const elementTypeName = typeName.slice(0, -2);
        let elementType = 'Any';
        if (elementTypeName === 'string') elementType = 'String';
        else if (elementTypeName === 'number') elementType = 'Number';
        else if (elementTypeName === 'boolean') elementType = 'Bool';
        else if (elementTypeName === 'any') elementType = 'Any';
        else if (elementTypeName === 'Symbol') elementType = 'Symbol';
        else elementType = parseTypeNode({ getText: () => elementTypeName, kind: typeNode.kind });
        return `[${elementType}]`;
    }
    // 处理数组类型
    if (typeNode.kind === ts.SyntaxKind.ArrayType) {
        const elementType = parseTypeNode(typeNode.getElementType());
        return `[${elementType}]`;
    }
    // 将 __type 替换为 Any
    if (typeName === '__type') {
        return 'Any';
    }
    // 处理泛型类型（如 Promise<void>、Array<string> 等）
    const genericMatch = typeName.match(/^([a-zA-Z_][a-zA-Z0-9_]*)<(.+)>$/);
    if (genericMatch) {
        const baseTypeName = genericMatch[1];
        const genericParams = genericMatch[2];
        // 递归处理泛型参数，并转换基本类型
        const processedParams = genericParams.split(',').map(param => {
            const trimmedParam = param.trim();
            // 转换基本类型
            if (trimmedParam === 'string') return 'String';
            if (trimmedParam === 'number') return 'Number';
            if (trimmedParam === 'boolean') return 'Bool';
            if (trimmedParam === 'void') return 'Void';
            if (trimmedParam === 'any') return 'Any';
            // 递归处理嵌套泛型
            return parseTypeNode({ getText: () => trimmedParam, kind: typeNode.kind });
        }).join(', ');
        return `${baseTypeName}<${processedParams}>`;
    }
    
    // 对于类或接口，返回实际类型名
    return typeName;
}

function parseType(type: Type): string {
    try {
        // 检查类型是否是联合类型
        if (type.isUnion()) {
            // 检查是否是 T | undefined 或 T | null 这种可选类型
            const unionTypes = type.getUnionTypes();
            if (unionTypes.length === 2) {
                const hasUndefined = unionTypes.some(t => t.isUndefined());
                const hasNull = unionTypes.some(t => t.isNull());
                
                if (hasUndefined || hasNull) {
                    // 找到非 undefined/null 的那个类型
                    const actualType = unionTypes.find(t => !t.isUndefined() && !t.isNull());
                    if (actualType) {
                        const baseType = parseType(actualType);
                        return `${baseType}?`;
                    }
                }
            }
            // 其他联合类型返回 Any
            return 'Any';
        }
        
        // 检查是否是接口、类、数组等聚合类型
        if (type.isObject()) {
            // 获取类型的 symbol
            const symbol = type.getSymbol?.() || type.getAliasSymbol?.();
            if (symbol) {
                // 获取类型名
                const typeName = symbol.getName();
                if (typeName) {
                    // 如果是 Interface 或 Class，返回类型名
                    return typeName;
                }
            }
            // 其他对象类型返回 Any
            return 'Any';
        }
        
        if (type.isNumber?.() || type.isNumberLiteral?.()) {
            return 'Number';
        } else if (type.isString?.() || type.isStringLiteral?.()) {
            return 'String';
        } else if (type.isBoolean?.() || type.isBooleanLiteral?.()) {
            return 'Bool';
        } else if (type.isNull?.() || type.isUndefined?.()) {
            return 'Any?';
        } else if (type.isVoid?.()) {
            return 'Void';
        } else if (type.isAny?.() || type.isUnknown?.()) {
            return 'Any';
        } else if (type.isArray?.()) {
            const elementType = parseType(type.getArrayElementType()!);
            return `[${elementType}]`;
        } else if (isFunctionType(type)) {
            const callSignature = type.getCallSignatures()?.[0];
            if (!callSignature) {
                return '() -> Any';
            }
            const parameters = callSignature.getParameters() || [];
            const paramTypes = parameters.map(param => {
                try {
                    return parseType(param.getType());
                } catch {
                    return 'Any';
                }
            }).join(', ');
            const returnType = parseType(callSignature.getReturnType() || type);
            return `(${paramTypes}) -> ${returnType}`;
        } else {
            // 检查是否有 symbol（类、接口等）
            const symbol = type.getSymbol?.() || type.getAliasSymbol?.();
            if (symbol) {
                const name = symbol.getName();
                // 将 __type 替换为 Any
                if (name === '__type') {
                    return 'Any';
                }
                // Symbol 类型
                if (name === 'Symbol') {
                    return 'Symbol';
                }
                return name;
            }
            // 其他对象类型返回 Any
            return 'Any';
        }
    } catch (error) {
        // 如果类型解析失败，返回 Any
        console.log(`Type parse error: ${error}`);
        return 'Any';
    }
}

// 辅助函数：获取 Swift 中的类型名称（用于运行时类型检查）
function getSwiftTypeName(typeName: string): string {
    if (typeName === 'string' || typeName === 'String') {
        return 'String';
    } else if (typeName === 'number' || typeName === 'Number') {
        return 'Number';
    } else if (typeName === 'boolean' || typeName === 'Bool') {
        return 'Bool';
    } else if (typeName === 'any' || typeName === 'Any') {
        return 'Any';
    } else {
        return typeName;
    }
}

// 生成 getTypeName 辅助函数的定义
function generateGetTypeNameHelper(): string {
    return `
// Helper function to get type name (for typeof operator)
func getTypeName(of value: Any) -> String {
    let mirror = Mirror(reflecting: value)
    let valueType = type(of: value)
    
    // Check basic types
    if value is String {
        return "string"
    } else if value is Number {
        return "number"
    } else if value is Bool {
        return "boolean"
    } else if value is Int || value is Double || value is Float {
        return "number"
    } else if value is Any.Type {
        return "function"
    } else if value is [Any] {
        return "object"
    } else if value is Object {
        return "object"
    } else if value is Null {
        return "object"
    } else {
        // Use Mirror's display type name
        let typeName = String(describing: valueType)
        if typeName.hasPrefix("Build.") {
            return String(typeName.dropFirst(6)).lowercased()
        }
        return typeName.lowercased()
    }
}
`;
}
