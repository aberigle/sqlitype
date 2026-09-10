export interface QueryStatement {
  all(...params: any[]): any[];
  run(...params: any[]): any;
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
  rows: any[];
}

export interface SqliteExecuteDriver {
  execute(query: any): Promise<SqlExecuteResult>;
}

export type SqliteDriver = SqliteQueryDriver | SqliteExecuteDriver;