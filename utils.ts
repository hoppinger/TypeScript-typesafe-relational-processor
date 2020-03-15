export type Without<T, K> = Pick<T, Exclude<keyof T, K>>
export type Fun<a, b> = (_: a) => b

export const Without = <T, K extends keyof T>(key: K, { [key]: _, ...values }: T): Without<T, K> => values
export const Rename = <T, KOld extends keyof T, KNew extends string>(keyOld: KOld, keyNew: KNew, { [keyOld]: value, ...values }: T):
  Without<T, KOld> & { [x in KNew]: T[KOld] } => 
  ({ ...values, ...{ [keyNew]: value } as { [x in KNew]: T[KOld] } })
