import * as yargs from "yargs";

import { addTypenameToDocument } from "apollo-utilities";

import { InputReader, OutputWriter } from "./io";
import { Parser } from "./pq";
import { logger } from "./log";

const defaultInput = "."
const defaultOutput = "gqlpq.json"
const defaultFilter = new RegExp("((\.graphql)|(\.gql))$", "i");

type Args = {
    input: string
    output: string
    typename: boolean
    filter: string | null
}

class App {
    public main(): number {
        const config = this.parseArgs();

        const parser = new Parser();
        if (config.typename) {
            parser.addTransformer(addTypenameToDocument);
        }

        let filter = defaultFilter;
        try {
            if (config.filter) {
                filter = new RegExp(config.filter, 'i');
            }
        } catch (err) {
            logger.error(`parsing filter regexp: ${err.message}`);
        }

        try {
            InputReader.loadFiles(config.input, filter, parser);
        } catch (err) {
            logger.error(`parsing graphql files: ${err.message}`);
            return 1;
        }

        try {
            OutputWriter.write(config.output, parser.getQueries());
        } catch (err) {
            logger.error(`writing persisted queries file: ${err.message}`);
            return 1;
        }

        return 0;
    }

    private parseArgs(): Args {
        const parg = yargs.options({
            input: { type: 'string', default: defaultInput },
            output: { type: 'string', default: defaultOutput },
            typename: { type: 'boolean', default: true },
            filter: { type: 'string', default: null },
        }).argv;

        return {
            input: parg.input,
            output: parg.output,
            typename: parg.typename,
            filter: parg.filter,
        }
    }
}

new App().main();
