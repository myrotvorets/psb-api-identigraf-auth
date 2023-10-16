export interface TrackServiceInterface {
    trackUpload(what: string, login: string, ips: string[], guid: string, dt: number): Promise<[number, boolean]>;
}
