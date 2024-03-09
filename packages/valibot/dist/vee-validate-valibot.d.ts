import { PartialDeep } from 'type-fest';
import { TypedSchema } from 'vee-validate';
import { BaseSchema, BaseSchemaAsync, Output, Input } from 'valibot';

declare function toTypedSchema<TSchema extends BaseSchema | BaseSchemaAsync, TOutput = Output<TSchema>, TInput = PartialDeep<Input<TSchema>>>(valibotSchema: TSchema): TypedSchema<TInput, TOutput>;

export { toTypedSchema };
