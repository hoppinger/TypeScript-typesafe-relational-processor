export declare type Without<T, K> = Pick<T, Exclude<keyof T, K>>;
export declare type Fun<a, b> = (_: a) => b;
export declare const Without: <T, K extends keyof T>(key: K, { [key]: _, ...values }: T) => Pick<T, Exclude<keyof T, K>>;
export declare const Rename: <T, KOld extends keyof T, KNew extends string>(keyOld: KOld, keyNew: KNew, { [keyOld]: value, ...values }: T) => Pick<T, Exclude<keyof T, KOld>> & { [x in KNew]: T[KOld]; };
