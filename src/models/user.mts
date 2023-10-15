import { Model } from 'objection';

export interface UserInterface {
    id: number;
    uid: string;
    login: string;
    admin: number;
    whitelisted: number;
    credits: number;
    lastseen: number;
    comment: string;
}

export class User extends Model implements UserInterface {
    public id!: number;
    public uid!: string;
    public login!: string;
    public admin!: number;
    public whitelisted!: number;
    public credits!: number;
    public lastseen!: number;
    public comment!: string;

    public static override tableName = 'sep_users';
}
