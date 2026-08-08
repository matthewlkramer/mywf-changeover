"""Convert Rails db/schema.rb into plain Postgres DDL for Supabase."""
import re
import sys

SKIP_PREFIXES = ("active_storage_", "good_job")

TYPE_MAP = {
    "string": "varchar",
    "text": "text",
    "integer": "integer",
    "bigint": "bigint",
    "boolean": "boolean",
    "datetime": "timestamptz",
    "date": "date",
    "jsonb": "jsonb",
    "json": "json",
    "uuid": "uuid",
    "decimal": "numeric",
    "float": "double precision",
}


def parse(path):
    src = open(path).read()
    tables = []
    for m in re.finditer(
        r'create_table "(?P<name>[^"]+)"(?P<opts>[^\n]*)do \|t\|\n(?P<body>.*?)\n  end\n',
        src,
        re.S,
    ):
        tables.append((m.group("name"), m.group("opts"), m.group("body")))
    fks = re.findall(r'add_foreign_key ([^\n]+)', src)
    return tables, fks


def col_sql(line):
    m = re.match(r'\s*t\.(?P<type>\w+) "(?P<name>[^"]+)"(?P<rest>.*)$', line)
    if not m:
        return None
    rtype, name, rest = m.group("type"), m.group("name"), m.group("rest")
    if rtype not in TYPE_MAP:
        return None
    pg = TYPE_MAP[rtype]
    if "array: true" in rest:
        pg += "[]"
    if rtype == "string":
        lm = re.search(r'limit: (\d+)', rest)
        if lm:
            pg = f"varchar({lm.group(1)})"
    parts = [f'  "{name}" {pg}']
    dm = re.search(r'default: (?P<d>-> \{ "[^"]+" \}|"[^"]*"|true|false|\d+|\[\])', rest)
    if dm:
        d = dm.group("d")
        if d.startswith("-> {"):
            d = re.search(r'"([^"]+)"', d).group(1)
        elif d == "[]":
            d = "'{}'"
        elif d.startswith('"'):
            d = "'" + d[1:-1].replace("'", "''") + "'"
        parts.append(f"DEFAULT {d}")
    if "null: false" in rest:
        parts.append("NOT NULL")
    return " ".join(parts)


def index_sql(table, line):
    m = re.match(r'\s*t\.index \[(?P<cols>[^\]]+)\], name: "(?P<name>[^"]+)"(?P<rest>.*)$', line)
    if not m:
        return None
    cols = ", ".join(f'"{c}"' for c in re.findall(r'"([^"]+)"', m.group("cols")))
    unique = "UNIQUE " if "unique: true" in m.group("rest") else ""
    where = ""
    wm = re.search(r'where: "(?P<w>.*?)"(?:,|$)', m.group("rest"))
    if wm:
        where = f" WHERE {wm.group('w')}"
    order = ""
    if "order: {" in m.group("rest"):
        return None  # rare; skip custom-order indexes
    return (
        f'CREATE {unique}INDEX IF NOT EXISTS "{m.group("name")}" '
        f'ON "{table}" ({cols}{order}){where};'
    )


def main(path):
    tables, fks = parse(path)
    out = ["-- Generated from Rails db/schema.rb. Domain tables only.", ""]
    indexes = []
    for name, opts, body in tables:
        if name.startswith(SKIP_PREFIXES):
            continue
        cols = []
        if 'id: :uuid' in opts:
            cols.append('  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid()')
        else:
            cols.append('  "id" bigserial PRIMARY KEY')
        for line in body.split("\n"):
            c = col_sql(line)
            if c:
                cols.append(c)
            else:
                i = index_sql(name, line)
                if i:
                    indexes.append(i)
        out.append(f'CREATE TABLE IF NOT EXISTS "{name}" (')
        out.append(",\n".join(cols))
        out.append(");")
        out.append("")
    out.extend(indexes)
    out.append("")
    for fk in fks:
        fm = re.match(r'"(?P<t>[^"]+)", "(?P<rt>[^"]+)"(?:, column: "(?P<col>[^"]+)")?', fk)
        if not fm or fm.group("t").startswith(SKIP_PREFIXES):
            continue
        col = fm.group("col") or fm.group("rt").rstrip("s") + "_id"
        cname = f'fk_{fm.group("t")}_{col}'
        out.append(
            f'ALTER TABLE "{fm.group("t")}" DROP CONSTRAINT IF EXISTS "{cname}";\n'
            f'ALTER TABLE "{fm.group("t")}" ADD CONSTRAINT "{cname}" '
            f'FOREIGN KEY ("{col}") REFERENCES "{fm.group("rt")}" ("id");'
        )
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1])
