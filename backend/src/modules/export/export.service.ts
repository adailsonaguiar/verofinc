import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface ExportPayload {
  exportedAt: string;
  collections: Record<string, unknown[]>;
}

const EXCLUDED_COLLECTIONS = new Set(['users']);

@Injectable()
export class ExportService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async exportAll(): Promise<ExportPayload> {
    const collections = await this.connection.db
      .listCollections({}, { nameOnly: true })
      .toArray();

    const collectionNames = collections
      .map((collection) => collection.name)
      .filter((name) => !this.shouldSkip(name))
      .sort();

    const exportedCollections: Record<string, unknown[]> = {};

    for (const name of collectionNames) {
      exportedCollections[name] = await this.connection.db
        .collection(name)
        .find({})
        .toArray();
    }

    return {
      exportedAt: new Date().toISOString(),
      collections: exportedCollections,
    };
  }

  private shouldSkip(name: string): boolean {
    const normalizedName = name.toLowerCase();
    return (
      EXCLUDED_COLLECTIONS.has(normalizedName) ||
      normalizedName.startsWith('system.')
    );
  }
}
