import * as schemaModule from './schema-transformTo-table.cjs';

const schema = schemaModule.default || schemaModule;

export default schema;
export const { schemaTransformToTable } = schema;
