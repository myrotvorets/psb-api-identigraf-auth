import type { Knex } from 'knex';

export interface LogEntry {
    id: number;
    login: string;
    guid: Buffer;
    ip: Buffer;
    dt: number;
    misc: string;
}

export type LogEntryForInsert = Omit<LogEntry, 'id'>;

interface ModelOptions {
    db: Knex<LogEntry, LogEntry[]> | Knex.Transaction<LogEntry, LogEntry[]>;
}

export class LogEntryModel {
    public static readonly tableName = 'sep_search_log';

    private readonly db: ModelOptions['db'];

    public constructor({ db }: ModelOptions) {
        this.db = db;
    }

    public insert(entry: LogEntryForInsert): Promise<number[]> {
        return this.db(LogEntryModel.tableName).insert(entry);
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [LogEntryModel.tableName]: LogEntry;
    }
}
