import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEnergyRecordsTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'energy_record',
      columns: [
        {
          name: 'id',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment'
        },
        {
          name: 'power',
          type: 'float'
        },
        {
          name: 'energy',
          type: 'float'
        },
        {
          name: 'voltage',
          type: 'float',
          isNullable: true
        },
        {
          name: 'current',
          type: 'float',
          isNullable: true
        },
        {
          name: 'pf',
          type: 'float',
          isNullable: true
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'interval',
          type: 'varchar',
          length: '20'
        },
        {
          name: 'deviceId',
          type: 'int'
        }
      ],
      foreignKeys: [
        {
          columnNames: ['deviceId'],
          referencedTableName: 'shelly_device',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE'
        }
      ]
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('energy_record');
  }
}