/**
  * vee-validate v4.12.5
  * (c) 2024 Abdelrahman Awad
  * @license MIT
  */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vee-validate'), require('valibot')) :
    typeof define === 'function' && define.amd ? define(['exports', 'vee-validate', 'valibot'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.VeeValidateValibot = {}, global.veeValidate, global.valibot));
})(this, (function (exports, veeValidate, valibot) { 'use strict';

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

    function toTypedSchema(valibotSchema) {
        const schema = {
            __type: 'VVTypedSchema',
            async parse(value) {
                const result = await valibot.safeParseAsync(valibotSchema, value);
                if (result.success) {
                    return {
                        value: result.output,
                        errors: [],
                    };
                }
                const errors = {};
                processIssues(result.issues, errors);
                return {
                    errors: Object.values(errors),
                };
            },
            cast(values) {
                if (valibotSchema.async) {
                    return values;
                }
                const result = valibot.safeParse(valibotSchema, values);
                if (result.success) {
                    return result.output;
                }
                const defaults = valibot.getDefault(valibot.optional(valibotSchema));
                if (isObject(defaults) && isObject(values)) {
                    return merge(defaults, values);
                }
                return values;
            },
            describe(path) {
                if (!path) {
                    return {
                        required: !queryOptional(valibotSchema),
                        exists: true,
                    };
                }
                const pathSchema = getSchemaForPath(path, valibotSchema);
                if (!pathSchema) {
                    return {
                        required: false,
                        exists: false,
                    };
                }
                return {
                    required: !queryOptional(pathSchema),
                    exists: true,
                };
            },
        };
        return schema;
    }
    function processIssues(issues, errors) {
        issues.forEach(issue => {
            var _a;
            const path = normalizeFormPath((issue.path || []).map(p => p.key).join('.'));
            if ((_a = issue.issues) === null || _a === void 0 ? void 0 : _a.length) {
                processIssues(issue.issues.flatMap(ue => ue.issues || []), errors);
                if (!path) {
                    return;
                }
            }
            if (!errors[path]) {
                errors[path] = { errors: [], path };
            }
            errors[path].errors.push(issue.message);
        });
    }
    function getSchemaForPath(path, schema) {
        if (!isObjectSchema(schema)) {
            return null;
        }
        if (veeValidate.isNotNestedPath(path)) {
            return schema.entries[veeValidate.cleanupNonNestedPath(path)];
        }
        const paths = (path || '').split(/\.|\[(\d+)\]/).filter(Boolean);
        let currentSchema = schema;
        for (let i = 0; i <= paths.length; i++) {
            const p = paths[i];
            if (!p || !currentSchema) {
                return currentSchema;
            }
            if (isObjectSchema(currentSchema)) {
                currentSchema = currentSchema.entries[p] || null;
                continue;
            }
            if (isIndex(p) && isArraySchema(currentSchema)) {
                currentSchema = currentSchema.item;
            }
        }
        return null;
    }
    function queryOptional(schema) {
        return schema.type === 'optional';
    }
    function isArraySchema(schema) {
        return isObject(schema) && schema.type === 'array';
    }
    function isObjectSchema(schema) {
        return isObject(schema) && schema.type === 'object';
    }

    exports.toTypedSchema = toTypedSchema;

}));
