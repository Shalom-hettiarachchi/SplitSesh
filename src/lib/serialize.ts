import { ObjectId } from "mongodb";

export function serializeDoc<T extends { _id: unknown }>(doc: T | null | undefined): any {
  if (!doc) return doc;
  const { _id, ...rest } = doc as any;
  return { _id: _id instanceof ObjectId ? _id.toString() : _id, ...rest };
}

export function toObjectId(id: string) {
  return new ObjectId(id);
}
