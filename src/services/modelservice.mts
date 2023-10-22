import type { Knex } from 'knex';
import { UserModel } from '../models/user.mjs';
import { LogEntryModel } from '../models/logentry.mjs';

interface ModelServiceOptions {
    db: Knex;
}

export interface Models {
    logEntry: LogEntryModel;
    user: UserModel;
}

export class ModelService {
    private readonly _db: Knex;
    private readonly _user: UserModel;
    private readonly _logEntry: LogEntryModel;

    public constructor({ db }: ModelServiceOptions) {
        this._db = db;
        this._user = new UserModel({ db });
        this._logEntry = new LogEntryModel({ db });
    }

    public get user(): UserModel {
        return this._user;
    }

    public get logEntry(): LogEntryModel {
        return this._logEntry;
    }

    public transaction<T = unknown>(
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        callback: (trx: Knex.Transaction, models: Models) => void | Promise<T>,
        config?: Knex.TransactionConfig,
    ): Promise<T> {
        return this._db.transaction<T>((trx) => {
            const models: Models = {
                user: new UserModel({ db: trx }),
                logEntry: new LogEntryModel({ db: trx }),
            };

            return callback(trx, models);
        }, config);
    }
}
