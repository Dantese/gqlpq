# gqlpq

Utility to parse GraphQL files from your client and generate list of persisted queries. It supports queries with fragments.

## Installation

```bash
$ yarn add gqlpg
```

## Usage

```bash
$ gqlpq --input path/to/graphql --output pq.json --typename true --filter "((\.graphql)|(\.gql))$"
```

## Example

This graphql file will be used to generate persisted queries:

```
query Book {
    books {
        title
        year
        author
    }
}
```

Generated output:

```
{"6fa3cc11f1c1adf09af3dbcc54829972bb8fbfa7be74e3811b1c517e01ac9e30":"query Book {\n  books {\n    title\n    year\n    author\n    __typename\n  }\n}\n"}
```
