import { statSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Parser } from "./pq";

export class InputReader {
    public static loadFiles(path: string, filter: RegExp, parser: Parser) {
        if (this.isDir(path)) {
            InputReader.readDir(path, filter, parser);
        } else {
            InputReader.readFile(path, parser);
        }
    }

    public static isDir(path: string): boolean {
        return statSync(path).isDirectory()
    }

    public static readDir(path: string, filter: RegExp, parser: Parser) {
        readdirSync(path).forEach(obj => {
            const fp = join(path, obj)
            if (InputReader.isDir(fp)) {
                InputReader.readDir(fp, filter, parser);
            } else if (filter.test(fp)) {
                InputReader.readFile(fp, parser);
            }
        });
    }

    public static readFile(path: string, parser: Parser) {
        parser.parse(readFileSync(path));
    }
}

export class OutputWriter {
    public static write(path: string, queries: { [key: string]: string }) {
        writeFileSync(path, JSON.stringify(queries));
    }
}
