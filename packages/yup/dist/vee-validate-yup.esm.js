/**
  * vee-validate v4.12.8
  * (c) 2024 Abdelrahman Awad
  * @license MIT
  */
import { isNotNestedPath, cleanupNonNestedPath } from 'vee-validate';

const isObject = (obj) => obj !== null && !!obj && typeof obj === 'object' && !Array.isArray(obj);
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

function toTypedSchema(yupSchema, opts = { abortEarly: false }) {
    const schema = {
        __type: 'VVTypedSchema',
        async parse(values) {
            var _a;
            try {
                // we spread the options because yup mutates the opts object passed
                const output = await yupSchema.validate(values, Object.assign({}, opts));
                return {
                    value: output,
                    errors: [],
                };
            }
            catch (err) {
                const error = err;
                // Yup errors have a name prop one them.
                // https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
                if (error.name !== 'ValidationError') {
                    throw err;
                }
                if (!((_a = error.inner) === null || _a === void 0 ? void 0 : _a.length) && error.errors.length) {
                    return { errors: [{ path: error.path, errors: error.errors }] };
                }
                const errors = error.inner.reduce((acc, curr) => {
                    const path = curr.path || '';
                    if (!acc[path]) {
                        acc[path] = { errors: [], path };
                    }
                    acc[path].errors.push(...curr.errors);
                    return acc;
                }, {});
                // list of aggregated errors
                return { errors: Object.values(errors) };
            }
        },
        cast(values) {
            try {
                return yupSchema.cast(values);
            }
            catch (_a) {
                const defaults = yupSchema.getDefault();
                if (isObject(defaults) && isObject(values)) {
                    return merge(defaults, values);
                }
                return values;
            }
        },
        describe(path) {
            try {
                if (!path) {
                    return getDescriptionFromYupSpec(yupSchema.spec);
                }
                const description = getSpecForPath(path, yupSchema);
                if (!description) {
                    return {
                        required: false,
                        exists: false,
                    };
                }
                return getDescriptionFromYupSpec(description);
            }
            catch (_a) {
                if ((process.env.NODE_ENV !== 'production')) {
                    console.warn(`Failed to describe path ${path} on the schema, returning a default description.`);
                }
                return {
                    required: false,
                    exists: false,
                };
            }
        },
    };
    return schema;
}
function getDescriptionFromYupSpec(spec) {
    return {
        required: !spec.optional,
        exists: true,
    };
}
function getSpecForPath(path, schema) {
    if (!isObjectSchema(schema)) {
        return null;
    }
    if (isNotNestedPath(path)) {
        const field = schema.fields[cleanupNonNestedPath(path)];
        return (field === null || field === void 0 ? void 0 : field.spec) || null;
    }
    const paths = (path || '').split(/\.|\[(\d+)\]/).filter(Boolean);
    let currentSchema = schema;
    for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        if (isObjectSchema(currentSchema) && p in currentSchema.fields) {
            currentSchema = currentSchema.fields[p];
        }
        else if (isIndex(p) && isArraySchema(currentSchema)) {
            currentSchema = currentSchema.innerType;
        }
        if (i === paths.length - 1) {
            return currentSchema.spec;
        }
    }
    return null;
}
function isObjectSchema(schema) {
    return isObject(schema) && schema.type === 'object';
}
function isArraySchema(schema) {
    return isObject(schema) && schema.type === 'array';
}

export { toTypedSchema };
