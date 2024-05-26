/**
  * vee-validate v4.12.8
  * (c) 2024 Abdelrahman Awad
  * @license MIT
  */
import { ValidationError } from 'joi';

function isIndex(value) {
    return Number(value) >= 0;
}
function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
function getTag(value) {
    if (value == null) {
        return value === undefined ? '[object Undefined]' : '[object Null]';
    }
    return Object.prototype.toString.call(value);
}
// Reference: https://github.com/lodash/lodash/blob/master/isPlainObject.js
function isPlainObject(value) {
    if (!isObjectLike(value) || getTag(value) !== '[object Object]') {
        return false;
    }
    if (Object.getPrototypeOf(value) === null) {
        return true;
    }
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}
function merge(target, source) {
    Object.keys(source).forEach(key => {
        if (isPlainObject(source[key]) && isPlainObject(target[key])) {
            if (!target[key]) {
                target[key] = {};
            }
            merge(target[key], source[key]);
            return;
        }
        target[key] = source[key];
    });
    return target;
}
/**
 * Constructs a path with dot paths for arrays to use brackets to be compatible with vee-validate path syntax
 */
function normalizeFormPath(path) {
    const pathArr = path.split('.');
    if (!pathArr.length) {
        return '';
    }
    let fullPath = String(pathArr[0]);
    for (let i = 1; i < pathArr.length; i++) {
        if (isIndex(pathArr[i])) {
            fullPath += `[${pathArr[i]}]`;
            continue;
        }
        fullPath += `.${pathArr[i]}`;
    }
    return fullPath;
}

/**
 * Transform a joi schema into TypedSchema
 *
 * @param joiSchema joi schema for transforming
 * @param opts validation options to pass to the joi validate function
 * @returns TypedSchema for using with vee-validate
 */
function toTypedSchema(joiSchema, opts) {
    const validationOptions = merge({ abortEarly: false }, opts || {});
    const schema = {
        __type: 'VVTypedSchema',
        async parse(value) {
            try {
                const result = await joiSchema.validateAsync(value, validationOptions);
                return {
                    value: result,
                    errors: [],
                };
            }
            catch (err) {
                if (!(err instanceof ValidationError)) {
                    throw err;
                }
                const error = err;
                return {
                    errors: processIssues(error),
                    rawError: err,
                };
            }
        },
        cast(values) {
            // Joi doesn't allow us to cast without validating
            const result = joiSchema.validate(values);
            if (result.error) {
                return values;
            }
            return result.value;
        },
    };
    return schema;
}
function processIssues(error) {
    const errors = {};
    error.details.forEach(detail => {
        const path = normalizeFormPath(detail.path.join('.'));
        if (errors[path]) {
            errors[path].errors.push(detail.message);
            return;
        }
        errors[path] = {
            path,
            errors: [detail.message],
        };
    });
    return Object.values(errors);
}

export { toTypedSchema };
