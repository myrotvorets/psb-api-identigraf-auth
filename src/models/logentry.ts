import { Model } from 'objection';

export interface LogEntryInterface {
    id: number;
    phone: string;
    guid: Buffer;
    ip: Buffer;
    dt: number;
    misc: string;
}

export default class LogEntry extends Model implements LogEntryInterface {
    public id!: number;
    public phone!: string;
    public guid!: Buffer;
    public ip!: Buffer;
    public dt!: number;
    public misc!: string;

    public static tableName = 'sep_search_log';
}
