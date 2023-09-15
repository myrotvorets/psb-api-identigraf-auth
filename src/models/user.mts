import { Model } from 'objection';

export interface UserInterface {
    id: number;
    uid: string;
    phone: string;
    admin: number;
    whitelisted: number;
    credits: number;
    lastseen: number;
    comment: string;
}

export class User extends Model implements UserInterface {
    public id!: number;
    public uid!: string;
    public phone!: string;
    public admin!: number;
    public whitelisted!: number;
    public credits!: number;
    public lastseen!: number;
    public comment!: string;

    public static tableName = 'sep_users';
}
