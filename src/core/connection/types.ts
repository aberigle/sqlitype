export interface QueryStatement {
  all(params?: any[]): any[];
  run(): any;
}

export interface SqliteQueryDriver {
  query(sql: string): QueryStatement;
}

export interface ExecuteStatement {
  sql: string;
  args?: any[];
}

export interface SqlExecuteResult {
  columns: string[];
  rows: any[][];
}

export interface SqliteExecuteDriver {
  execute(query: string | ExecuteStatement): Promise<SqlExecuteResult>;
}

export type SqliteDriver = SqliteQueryDriver | SqliteExecuteDriver;