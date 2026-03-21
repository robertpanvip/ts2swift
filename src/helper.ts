import {Statement, Node, Block, Type, SourceFile} from "ts-morph";
import fs from "node:fs";
import path from "node:path";

export function hasReturn(block: Block) {
    return hasReturnDeep(block.getStatements())
}

/**
 * 更彻底的版本：递归遍历所有嵌套语句（防止 return 藏在 if/for 里）
 */
export function hasReturnDeep(statements: readonly Statement[]): boolean {
    for (const stmt of statements) {
        if (Node.isReturnStatement(stmt)) {
            return true;
        }

        // 递归检查嵌套块：if、for、while、do、try/catch、block 等
        if (Node.isBlock(stmt) ||
            Node.isIfStatement(stmt) ||
            Node.isForStatement(stmt) ||
            Node.isForInStatement(stmt) ||
            Node.isForOfStatement(stmt) ||
            Node.isWhileStatement(stmt) ||
            Node.isDoStatement(stmt) ||
            Node.isTryStatement(stmt)) {
            const childBlocks: Block[] = [];

            // 收集所有可能的子块
            if (Node.isBlock(stmt)) childBlocks.push(stmt as Block);
            if (Node.isIfStatement(stmt)) {
                const thenStmt = stmt.getThenStatement();
                const elseStmt = stmt.getElseStatement();
                if (Node.isBlock(thenStmt)) childBlocks.push(thenStmt as Block);
                if (elseStmt && Node.isBlock(elseStmt)) childBlocks.push(elseStmt as Block);
            }
            if (Node.isTryStatement(stmt)) {
                const tryBlock = stmt.getTryBlock();
                const catchClause = stmt.getCatchClause();
                const finallyBlock = stmt.getFinallyBlock();
                if (tryBlock) childBlocks.push(tryBlock);
                if (catchClause?.getBlock()) childBlocks.push(catchClause.getBlock());
                if (finallyBlock) childBlocks.push(finallyBlock);
            }
            // 其他循环语句类似...

            // 递归检查子块
            for (const block of childBlocks) {
                if (hasReturnDeep(block.getStatements())) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * 核心：判断类型是否为函数类型（替代 isFunction/isSignature）
 * @param type ts-morph 的 Type 实例
 * @returns 是否为函数/方法/签名类型
 */
export function isFunctionType(type: Type): boolean {
    // 3. 兜底：通过类型的符号/声明判断（覆盖边缘场景）
    const symbol = type.getSymbol() || type.getAliasSymbol();
    if (!symbol) return false;

    const declarations = symbol.getDeclarations();
    return declarations.some(decl =>
        Node.isFunctionDeclaration(decl) ||
        Node.isFunctionExpression(decl) ||
        Node.isArrowFunction(decl) ||
        Node.isMethodDeclaration(decl) ||
        Node.isMethodSignature(decl)
    );
}

export const isUppercaseStart = (s: string) => /^[A-Z]/.test(s);

const cwd = process.cwd();
const appDirectory = fs.realpathSync(cwd);

// 清理output目录
export function cleanOutputDir() {
    const outputDir = path.resolve(appDirectory, 'test', 'build', 'Sources', 'Build');

    if (fs.existsSync(outputDir)) {
        // 读取目录中的所有文件
        const files = fs.readdirSync(outputDir);

        // 删除除了Core.swift之外的所有文件
        files.forEach(file => {
            if (file !== 'Core.swift') {
                const filePath = path.join(outputDir, file);
                fs.unlinkSync(filePath);
                //console.log(`Deleted ${filePath}`);
            }
        });
    }
}

// 合并core目录下的所有Swift文件到Core.swift
export function mergeCoreFiles() {
    const coreDir = path.resolve(appDirectory, 'core');
    const outputDir = path.resolve(appDirectory, 'test', 'build', 'Sources', 'Build');
    const outputPath = path.join(outputDir, 'Core.swift');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let coreContent = '';

    // 读取core目录下的所有Swift文件
    const coreFiles = fs.readdirSync(coreDir).filter(file => file.endsWith('.swift'));

    coreFiles.forEach(file => {
        const filePath = path.join(coreDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        coreContent += content + '\n\n';
    });

    // 写入合并后的内容到Core.swift
    fs.writeFileSync(outputPath, coreContent);
   // console.log(`Merged core files into ${outputPath}`);
}


// 生成Package.swift文件
export function generatePackageSwift() {
    const outputDir = path.resolve(appDirectory, 'test', 'build', 'Sources', 'Build');
    const packagePath = path.resolve(appDirectory, 'test', 'build', 'Package.swift');

    // 读取output目录中的所有Swift文件
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.swift'));

    // 生成Package.swift内容
    const packageContent = `// swift-tools-version:5.7

import PackageDescription

let package = Package(
    name: "Build",
    products: [
        .executable(name: "Build", targets: ["Build"]),
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "Build",
            path: "Sources/Build",
            sources: [${files.map(file => `"${file}"`).join(', ')}]
        ),
    ]
)`;

    // 写入Package.swift文件
    fs.writeFileSync(packagePath, packageContent);
    //console.log(`Generated Package.swift at ${packagePath}`);
}

export function generateOutput(sourceFile:SourceFile,generateSwiftCode:string) {

    // 生成 Swift 代码
    const swiftCode = generateSwiftCode;

    // 输出到 test/build/Sources/Build 目录
    let baseName = sourceFile.getBaseNameWithoutExtension();
    // Swift 文件名不能包含 -，需要替换为 _
    baseName = baseName.replace(/-/g, '_');
    
    const outputDir = path.resolve(appDirectory, 'test', 'build', 'Sources', 'Build');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `${baseName}.swift`);
    fs.writeFileSync(outputPath, swiftCode);
    //console.log(`Generated Swift code at ${outputPath}`);
}