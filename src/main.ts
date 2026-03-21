import {
    Block,
    ClassDeclaration, ClassMemberTypes, ExportAssignment,
    Expression, ExpressionStatement, ForStatement,
    FunctionDeclaration,
    IfStatement,
    ImportDeclaration,
    InterfaceDeclaration, Node,
    ParameterDeclaration,
    Project,
    ReturnStatement, SourceFile,
    Statement,
    ts,
    Type, TypeAliasDeclaration,
    VariableDeclaration,
    VariableDeclarationKind, VariableStatement,
    WhileStatement
} from "ts-morph";
import {
    isFunctionType,
    cleanOutputDir,
    mergeCoreFiles,
    generatePackageSwift,
    generateOutput
} from "./helper";
import path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type CodeResult = {
    code: string,
    type?: string
};

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

// 处理对象字面量，返回类名
function processObjectLiteral(expression: any): string {
    // 检查是否有计算属性名（如 [Symbol()]）
    const hasComputedProperty = expression.getProperties().some((property: any) => {
        return Node.isComputedPropertyName(property.getNameNode());
    });
    
    // 如果有计算属性名，返回简单的 Object 初始化
    if (hasComputedProperty) {
        return 'Object()';
    }
    
    // 生成属性声明
    const properties = expression.getProperties().map((property: any) => {
        if (Node.isPropertyAssignment(property)) {
            const propName = property.getName();
            const initializer = property.getInitializer();
            let propType = 'Any';
            
            // 推导属性类型
            if (Node.isObjectLiteralExpression(initializer)) {
                propType = 'Object';
            } else if (Node.isStringLiteral(initializer)) {
                propType = 'String';
            } else if (Node.isNumericLiteral(initializer)) {
                propType = 'Number';
            } else if (initializer?.getKindName() === 'TrueKeyword' || initializer?.getKindName() === 'FalseKeyword') {
                propType = 'Bool';
            }
            
            return `public var ${propName}: ${propType}`;
        }
        return '';
    }).filter(Boolean).join('\n        ');
    
    // 生成 init 参数
    const initParams = expression.getProperties().map((property: any) => {
        if (Node.isPropertyAssignment(property)) {
            const propName = property.getName();
            const initializer = property.getInitializer();
            let propType = 'Any';
            
            // 推导参数类型
            if (Node.isObjectLiteralExpression(initializer)) {
                propType = 'Object';
            } else if (Node.isStringLiteral(initializer)) {
                propType = 'String';
            } else if (Node.isNumericLiteral(initializer)) {
                propType = 'Number';
            } else if (initializer?.getKindName() === 'TrueKeyword' || initializer?.getKindName() === 'FalseKeyword') {
                propType = 'Bool';
            }
            
            return `${propName}: ${propType}`;
        }
        return '';
    }).filter(Boolean).join(', ');
    
    // 生成 init 方法体
    const initAssignments = expression.getProperties().map((property: any) => {
        if (Node.isPropertyAssignment(property)) {
            const propName = property.getName();
            return `        self.${propName} = ${propName}`;
        }
        return '';
    }).filter(Boolean).join('\n');
    
    const className = `AnonymousObject_${objectLiteralCounter++}`;
    const classDef = `class ${className}: Object {\n        ${properties}\n        \n        init(${initParams}) {\n${initAssignments}\n            super.init()\n        }\n    }`;
    anonymousClasses.push(classDef);
    
    // 生成初始化参数
    const initArgs = expression.getProperties().map((property: any) => {
        if (Node.isPropertyAssignment(property)) {
            const propName = property.getName();
            const initializer = property.getInitializer();
            let propValue = '';
            
            if (Node.isObjectLiteralExpression(initializer)) {
                propValue = processObjectLiteral(initializer);
            } else {
                propValue = parseExpression(initializer).code;
            }
            
            return `${propName}: ${propValue}`;
        }
        return '';
    }).filter(Boolean).join(', ');
    
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
            moduleCode += `    ${exportedMembers.join('\n    ')}\n`;
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
            moduleCode += `        ${importStatements.join('\n        ')}\n`;
        }
        // 然后执行顶层语句
        if (topLevelStatements.length > 0) {
            moduleCode += `        ${topLevelStatements.join('\n        ')}\n`;
        }
        moduleCode += `    }\n`;
        
        moduleCode += `}\n`;
    }
    
    // 组合代码（不包括类，因为它们已经在 enum 内部）
    const allDeclarations = [...protocolDeclarations, ...enumDeclarations, ...anonymousClasses].join('\n\n');
    return `${uniqueImports.join('\n')}\n\n${moduleCode}\n${allDeclarations}\n\n`;
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
    } else if (Node.isWhileStatement(statement)) {
        return parseWhileStatement(statement);
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
        const name = declaration.getName();
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
            // 检查初始化表达式是否是对象字面量
            const isObjectLiteral = Node.isObjectLiteralExpression(initializer);
            
            if (isObjectLiteral) {
                // 生成匿名类（递归处理嵌套对象）
                const initializerCodeFromLiteral = processObjectLiteral(initializer);
                initializerCode = initializerCodeFromLiteral;
                // 省略类型注解，让 Swift 自动推断为匿名类类型
                shouldOmitType = true;
            } else if (Node.isNewExpression(initializer)) {
                // new 表达式，使用类名作为类型
                initializerCode = parseExpression(initializer).code;
                // 获取类名
                const className = initializer.getExpression().getText();
                finalTypeStr = className;
            } else if (Node.isCallExpression(initializer)) {
                // CallExpression（如 Symbol()），让 Swift 推断类型
                initializerCode = parseExpression(initializer).code;
                shouldOmitType = true;
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

function parseFunctionDeclaration(statement: FunctionDeclaration): CodeResult {
    const isExport = statement.hasModifier(ts.SyntaxKind.ExportKeyword);
    const isDefault = statement.hasModifier(ts.SyntaxKind.DefaultKeyword);
    const name = statement.getName() || '';
    
    console.log(`parseFunctionDeclaration: ${name}, isExport=${isExport}, isDefault=${isDefault}`);
    
    const parameters = statement.getParameters();
    const returnType = statement.getReturnType();
    const body = statement.getBody();
    
    // 获取泛型参数
    const typeParameters = statement.getTypeParameters() || [];
    const genericParams = typeParameters.map(tp => tp.getName()).join(', ');
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

    const returnTypeStr = parseType(returnType);
    let bodyStr = '{}';
    if (body) {
        // 直接获取块内的语句，不添加外层花括号
        const statements = (body as Block).getStatements()
            .map(statement => parseStatement(statement).code)
            .join('\n');
        // 为每一行添加 4 个空格的缩进
        const indentedStatements = statements.split('\n').map(line => '    ' + line).join('\n');
        bodyStr = `{\n${indentedStatements}\n}`;
    }
    
    // 当返回类型是 void 时，不添加返回类型
    const returnTypePart = returnTypeStr === 'Void' ? '' : `-> ${returnTypeStr}`;
    
    // 如果是默认导出，添加特殊标记
    const defaultMarker = isDefault ? ' // DEFAULT_EXPORT' : '';
    
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

    let properties: string[] = [];
    let methods: string[] = [];
    let initializer: string[] = [];

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
            const accessModifier = isPrivate ? 'private ' : '';
            properties.push(`${accessModifier}${staticKeyword}${varKeyword} ${propName}: ${propType}${initStr}`);
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
                return `_ ${paramName}: ${paramType}`;
            }).join(', ');

            const returnTypeStr = parseType(returnType);
            
            // abstract 方法没有方法体
            let methodStr = '';
            if (isAbstract) {
                // Swift 没有直接的 abstract，使用 protocol 或要求子类实现
                // 这里我们生成一个空实现，或者可以抛出 fatalError
                methodStr = `func ${methodName}(${params}) -> ${returnTypeStr} { fatalError("Abstract method ${methodName} not implemented") }`;
            } else {
                const bodyStr = body ? parseBlock(body as Block).code : '{}';
                methodStr = `func ${methodName}(${params}) -> ${returnTypeStr} ${bodyStr}`;
            }
            
            // 添加修饰符
            const staticKeyword = isStatic ? 'static ' : '';
            const overrideKeyword = isOverride ? 'override ' : '';
            methods.push(`${overrideKeyword}${staticKeyword}${methodStr}`);
        } else if (Node.isConstructorDeclaration(member)) {
            const parameters = member.getParameters();
            const body = member.getBody();

            const params = parameters.map((param: ParameterDeclaration) => {
                const paramName = param.getName();
                const paramType = parseType(param.getType());
                return `_ ${paramName}: ${paramType}`;
            }).join(', ');

            const bodyStr = body ? parseBlock(body as Block).code : '{}';

            initializer.push(`init(${params}) ${bodyStr}`);
        }
    });

    const classBody = [...properties, ...initializer, ...methods].join('\n\n');
    
    // 抽象类使用注释标记（Swift 没有直接的 abstract 类）
    const classKeyword = isAbstract ? '/* abstract */ class' : 'class';

    return {
        code: `${isExport ? 'public ' : ''}${classKeyword} ${name}${genericStr}${inheritsStr} {\n${classBody}\n}`
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

    members.forEach((member: any) => {
        if (Node.isPropertySignature(member)) {
            const propName = member.getName();
            const propType = parseType(member.getType());
            properties.push(`var ${propName}: ${propType} { get }`);
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

    return {
        code: `${isExport ? 'public ' : ''}protocol ${name} {\n    ${protocolBody}\n}`
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
    
    let thenStr = '';
    if (Node.isBlock(thenStatement)) {
        const blockResult = parseBlock(thenStatement as Block);
        // 移除块末尾的换行和闭合括号，稍后添加
        thenStr = blockResult.code;
    } else {
        thenStr = `{\n        ${parseStatement(thenStatement).code}\n    }`;
    }
    
    let elseStr = '';
    const elseStatement = statement.getElseStatement();
    if (elseStatement) {
        if (Node.isBlock(elseStatement)) {
            const blockResult = parseBlock(elseStatement as Block);
            elseStr = ` else ${blockResult.code}`;
        } else if (Node.isIfStatement(elseStatement)) {
            // 嵌套的 if-else
            elseStr = ` else ${parseIfStatement(elseStatement as IfStatement).code}`;
        } else {
            elseStr = ` else {\n        ${parseStatement(elseStatement).code}\n    }`;
        }
    }
    
    return {code: `if ${condition} ${thenStr}${elseStr}`};
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
    let incrementCode = incrementor ? parseExpression(incrementor).code : '';

    // 处理自增运算符 ++
    if (incrementCode.includes('++')) {
        const variableName = incrementCode.replace('++', '').trim();
        incrementCode = `${variableName} = ${variableName} + Number(1)`;
    }

    // 处理自减运算符 --
    if (incrementCode.includes('--')) {
        const variableName = incrementCode.replace('--', '').trim();
        incrementCode = `${variableName} = ${variableName} - Number(1)`;
    }
    
    let bodyCode = '';
    if (body && Node.isBlock(body)) {
        // 将 increment 代码添加到循环体的末尾
        const blockStatements = body.getStatements().map(statement => parseStatement(statement).code).join('\n');
        const incrementStmt = incrementCode ? `\n${incrementCode}` : '';
        // 为每一行添加 12 个空格的缩进（do 块 4 个 + while 循环 4 个 + 循环体 4 个）
        const allStatements = blockStatements + incrementStmt;
        const indentedStatements = allStatements.split('\n').map(line => '            ' + line).join('\n');
        bodyCode = `{\n${indentedStatements}\n        }`;
    } else if (body) {
        bodyCode = `{\n            ${parseStatement(body).code} ${incrementCode}\n        }`;
    } else {
        bodyCode = `{ ${incrementCode} }`;
    }
    
    // Swift 不支持 C 风格的 for 循环，使用 while 循环替代
    // 将初始化代码和 while 循环包装到一个 do 块中，避免变量污染外部作用域
    // do 块的闭合括号与 main 函数的缩进级别一致
    return {code: `do {\n        ${initCode}; while ${conditionCode} ${bodyCode}\n    }`};
}

function parseWhileStatement(statement: WhileStatement): CodeResult {
    const condition = parseExpression(statement.getExpression()).code;
    const body = statement.getStatement();
    
    let bodyCode = '';
    if (body && Node.isBlock(body)) {
        bodyCode = parseBlock(body as Block).code;
    } else if (body) {
        bodyCode = `{ ${parseStatement(body).code} }`;
    } else {
        bodyCode = '{}';
    }
    
    return {code: `while ${condition} ${bodyCode}`};
}


function parseExpression(expression?: Expression): CodeResult {
    if (!expression) {
        return {code: 'Undefined()'};
    }

    if (Node.isIdentifier(expression)) {
        const idText = expression.getText();
        if (idText === 'null') {
            return {code: 'Null()'};
        } else if (idText === 'undefined') {
            return {code: 'Undefined()'};
        }
        return {code: idText};
    } else if (expression.getKind() === ts.SyntaxKind.NullKeyword) {
        return {code: 'Null()'};
    } else if (expression.getKind() === ts.SyntaxKind.UndefinedKeyword) {
        return {code: 'Undefined()'};
    } else if (Node.isStringLiteral(expression)) {
        return {code: `"${expression.getLiteralValue()}"`};
    } else if (Node.isNoSubstitutionTemplateLiteral(expression)) {
        // 处理不带变量的模板字符串（反引号字符串）
        return {code: `"${expression.getLiteralValue()}"`};
    } else if (Node.isNumericLiteral(expression)) {
        return {code: `Number(${expression.getLiteralValue()})`};
    } else if (expression.getKind() === ts.SyntaxKind.TrueKeyword || expression.getKind() === ts.SyntaxKind.FalseKeyword) {
        return {code: expression.getText()};
    } else if (Node.isBinaryExpression(expression)) {
        const left = parseExpression(expression.getLeft()).code;
        const right = parseExpression(expression.getRight()).code;
        const operator = expression.getOperatorToken().getText();

        // 处理一些特殊运算符
        let swiftOperator = operator;
        if (operator === '===') {
            swiftOperator = '==';
        } else if (operator === '!==') {
            swiftOperator = '!=';
        } else if (operator === '??') {
            swiftOperator = '??';
        }

        return {code: `${left} ${swiftOperator} ${right}`};
    } else if (Node.isNewExpression(expression)) {
        // 处理new表达式，在Swift中不需要new关键字
        const expressionPart = parseExpression(expression.getExpression()).code;
        const argsList = expression.getArguments();
        const args = argsList.map(arg => parseExpression(arg as Expression).code).join(', ');
        // 移除泛型参数，Swift会自动推断
        const cleanedExpression = expressionPart.replace(/<[^>]+>/g, '');
        return {code: `${cleanedExpression}(${args})`};
    } else if (Node.isCallExpression(expression)) {
        const callee = expression.getExpression();
        const argsList = expression.getArguments();
        
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
            
            if (arrayMethodMap[methodName]) {
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
        
        // 对于 Any 类型的属性访问，添加类型转换
        // 但是 console、window、字符串和数组对象是有明确类型的，不需要转换
        // 检查是否为数组类型：如果对象是标识符且属性是数组方法，或者对象是数组字面量
        const arrayMethods = ['map', 'filter', 'reduce', 'find', 'sort', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'join', 'reverse', 'forEach'];
        const stringProperties = ['length', 'charAt', 'substring', 'indexOf', 'split', 'replace', 'toUpperCase', 'toLowerCase', 'trim'];
        
        // 数组 length 转换为 count
        if (property === 'length') {
            // 检查是否是数组的 length 属性（简单判断：对象名包含 arr）
            // 更好的方法是检查类型，但这里简单处理
            return {code: `${object}.count`};
        }
        
        // 如果属性是字符串或数组的方法/属性，直接返回
        if (stringProperties.includes(property) || arrayMethods.includes(property)) {
            return {code: `${object}.${property}`};
        }
        
        // 使用点号访问，而不是下标
        return {code: `${object}.${property}`};
    } else if (Node.isElementAccessExpression(expression)) {
        const object = parseExpression(expression.getExpression()).code;
        const index = parseExpression(expression.getArgumentExpression()).code;
        return {code: `${object}[${index}]`};
    } else if (Node.isArrowFunction(expression)) {
        const parameters = expression.getParameters().map(param => {
            const paramName = param.getName();
            const paramType = parseType(param.getType());
            return `${paramName}: ${paramType}`;
        }).join(', ');

        const returnType = parseType(expression.getReturnType());
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

        return {code: `{ (${parameters}) -> ${returnType} in\n    ${bodyCode}\n}`};
    } else if (Node.isFunctionExpression(expression)) {
        // 处理函数表达式，转换为 Swift 闭包
        const parameters = expression.getParameters().map(param => {
            const paramName = param.getName();
            const paramType = parseType(param.getType());
            return `${paramName}: ${paramType}`;
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

        let parts = [`"${head}"`];
        spans.forEach(span => {
            const expressionCode = parseExpression(span.getExpression()).code;
            const literal = span.getLiteral().getLiteralText();
            parts.push(expressionCode);
            parts.push(`"${literal}"`);
        });

        return {code: parts.join(' + ')};
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
        .map(statement => parseStatement(statement).code)
        .join('\n');
    // 为每一行添加 8 个空格的缩进（因为块已经在 main 函数内部）
    const indentedStatements = statements.split('\n').map(line => '        ' + line).join('\n');
    return {code: `{\n${indentedStatements}\n    }`};
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
    const typeName = typeNode.getText();
    // 处理基本类型
    if (typeName === 'string') return 'String';
    if (typeName === 'number') return 'Number';
    if (typeName === 'boolean') return 'Bool';
    if (typeName === 'any') return 'Any';
    if (typeName === 'Object') return 'Object';
    if (typeName === 'void') return 'Void';
    if (typeName === 'null') return 'Any?';
    if (typeName === 'undefined') return 'Any?';
    if (typeName === 'Symbol') return 'Symbol';
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
    // 对于类或接口，返回实际类型名
    return typeName;
}

function parseType(type: Type): string {
    if (type.isNumber() || type.isNumberLiteral()) {
        return 'Number';
    } else if (type.isString() || type.isStringLiteral()) {
        return 'String';
    } else if (type.isBoolean() || type.isBooleanLiteral()) {
        return 'Bool';
    } else if (type.isNull() || type.isUndefined()) {
        return 'Any?';
    } else if (type.isVoid()) {
        return 'Void';
    } else if (type.isAny() || type.isUnknown()) {
        return 'Any';
    } else if (type.isArray()) {
        const elementType = parseType(type.getArrayElementType()!);
        return `[${elementType}]`;
    } else if (isFunctionType(type)) {
        const callSignature = type.getCallSignatures()[0];
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
        const symbol = type.getSymbol() || type.getAliasSymbol();
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
}
