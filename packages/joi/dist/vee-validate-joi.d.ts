import { TypedSchema } from 'vee-validate';
import { Schema, AsyncValidationOptions } from 'joi';
import { PartialDeep } from 'type-fest';

/**
 * Gets the type of data from the schema
 */
type DataTypeOf<JoiSchema> = JoiSchema extends Schema<infer U> ? U : never;
/**
 * Transform a joi schema into TypedSchema
 *
 * @param joiSchema joi schema for transforming
 * @param opts validation options to pass to the joi validate function
 * @returns TypedSchema for using with vee-validate
 */
declare function toTypedSchema<TSchema extends Schema, TOutput = DataTypeOf<TSchema>, TInput = PartialDeep<DataTypeOf<TSchema>>>(joiSchema: TSchema, opts?: AsyncValidationOptions): TypedSchema<TInput, TOutput>;

export { toTypedSchema };
