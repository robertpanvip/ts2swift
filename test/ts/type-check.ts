import { Project, ts } from "ts-morph";

const project = new Project();
const sourceFile = project.addSourceFileAtPath("./test/ts/optional-chain-test.ts");

// 获取所有变量声明
const declarations = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration);

declarations.forEach(decl => {
    const name = decl.getName();
    const type = decl.getType();
    const typeText = type.getText();
    const isUnion = type.isUnion();
    
    console.log(`${name}: ${typeText} (isUnion: ${isUnion})`);
    
    if (isUnion) {
        const unionTypes = type.getUnionTypes();
        console.log(`  Union types: ${unionTypes.map(t => t.getText()).join(', ')}`);
    }
});
