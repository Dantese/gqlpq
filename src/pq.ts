import { parse, print, DocumentNode, OperationDefinitionNode, FragmentDefinitionNode, visit, DefinitionNode } from "graphql"
import { defaultGenerateHash } from "apollo-link-persisted-queries"

const operationFilter = (doc: DocumentNode): OperationDefinitionNode[] => {
    return doc.definitions.filter(
        definition => definition.kind === 'OperationDefinition',
    ) as OperationDefinitionNode[];
}

const fragmentFilter = (doc: DocumentNode): FragmentDefinitionNode[] => {
    return doc.definitions.filter(
        definition => definition.kind === 'FragmentDefinition',
    ) as FragmentDefinitionNode[];
}

export type TransformFn = (doc: DocumentNode) => DocumentNode;
export type IdGeneratorFn = (doc: DocumentNode) => string;

export class Parser {
    private operations: Map<string, OperationDefinitionNode> = new Map();
    private fragments: Map<string, FragmentDefinitionNode> = new Map();

    private transformers: TransformFn[] = [];
    private idGenerator: IdGeneratorFn = defaultGenerateHash;

    public addTransformer(transformer: TransformFn) {
        this.transformers.push(transformer);
    }

    public setIdGenerator(generator: IdGeneratorFn) {
        this.idGenerator = generator;
    }

    public parse(data: Buffer) {
        let doc;
        try {
            doc = parse(data.toString('utf-8'));
        } catch (err) {
            throw new Error(`parsing graphql file: ${err.message}`);
        }

        operationFilter(doc).forEach(operation => {
            if (!operation.name) {
                throw Error(`operation shoud have name: ${print(operation)}`);
            } else if (this.operations.has(operation.name.value)) {
                throw Error(`duplicated operation name: ${operation.name.value}`);
            } else {
                this.operations.set(operation.name.value, operation);
            }
        });


        fragmentFilter(doc).forEach(fragment => {
            if (!fragment.name) {
                throw Error(`fragment shoud have name: ${print(fragment)}`);
            } else if (this.fragments.get(fragment.name.value)) {
                throw Error(`duplicated fragment name: ${fragment.name.value}`);
            } else {
                this.fragments.set(fragment.name.value, fragment);
            }
        })
    }

    public getQueries(): { [key: string]: string } {
        const queries: { [key: string]: string } = {};

        this.operations.forEach(operation => {
            let queryString = print(operation);
            this.getQueryFragments(operation).forEach(fragment => {
                queryString += '\n\n' + print(fragment);
            });

            let doc = parse(queryString);
            this.transformers.forEach(transformer => doc = transformer(doc));

            queries[this.idGenerator(doc)] = print(doc);
        });

        return queries;
    }

    private getQueryFragments(query: DefinitionNode): FragmentDefinitionNode[] {
        const fragments: Set<FragmentDefinitionNode> = new Set();
        this.recQueryFragments(query, fragments);
        return [...fragments];
    };

    private recQueryFragments(query: DefinitionNode, fragments: Set<FragmentDefinitionNode>) {
        const that = this;
        visit(query, {
            FragmentSpread(node) {
                const fragment = that.fragments.get(node.name.value)
                if (!fragment) {
                    throw Error(`fragment definition not found: ${node.name.value}`)
                } else {
                    fragments.add(fragment);
                }

                const next = that.operations.get(node.name.value);
                if (next) {
                    that.recQueryFragments(next, fragments);
                }
            },
        });
    }
}
