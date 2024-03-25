import { defineNuxtModule, addImports, addComponent, logger } from '@nuxt/kit';
import { isPackageExists } from 'local-pkg';

const components = ["Field", "Form", "ErrorMessage", "FieldArray"];
const composables = [
  "useField",
  "useForm",
  "useFieldArray",
  "useFieldError",
  "useFieldValue",
  "useFormErrors",
  "useFormValues",
  "useIsFieldDirty",
  "useIsFieldTouched",
  "useIsFieldValid",
  "useIsFormDirty",
  "useIsFormTouched",
  "useIsFormValid",
  "useIsSubmitting",
  "useResetForm",
  "useSubmitCount",
  "useSubmitForm",
  "useValidateField",
  "useValidateForm"
];
const schemaProviderResolvers = {
  zod: "@vee-validate/zod",
  yup: "@vee-validate/yup",
  valibot: "@vee-validate/valibot"
};
const module = defineNuxtModule({
  meta: {
    name: "vee-validate",
    configKey: "veeValidate"
  },
  defaults: {
    autoImports: true,
    componentNames: {}
  },
  setup(options) {
    if (options.autoImports) {
      composables.forEach((composable) => {
        addImports({
          name: composable,
          as: composable,
          from: "vee-validate"
        });
      });
      components.forEach((component) => {
        addComponent({
          name: options.componentNames?.[component] ?? component,
          export: component,
          filePath: "vee-validate"
        });
      });
    }
    if (options.typedSchemaPackage === "none") {
      return;
    }
    if (options.typedSchemaPackage === "yup") {
      checkForYup(options);
      return;
    }
    if (options.typedSchemaPackage === "zod") {
      checkForZod(options);
      return;
    }
    if (options.typedSchemaPackage === "valibot") {
      checkForValibot(options);
      return;
    }
    if (!checkForYup(options)) {
      if (!checkForZod(options)) {
        checkForValibot(options);
      }
    }
  }
});
function checkSchemaResolverDependencies(pkgName) {
  const makeMsg = (installed, uninstalled) => `You seem to be using ${installed}, but you have not installed ${uninstalled}. Please install it to use ${pkgName} with vee-validate.`;
  const resolverPkg = schemaProviderResolvers[pkgName];
  if (isPackageExists(pkgName) && !isPackageExists(resolverPkg)) {
    logger.warn(makeMsg(pkgName, resolverPkg));
    return true;
  }
  if (isPackageExists(resolverPkg) && !isPackageExists(pkgName)) {
    logger.warn(makeMsg(resolverPkg, pkgName));
    return true;
  }
}
function checkForValibot(options) {
  checkSchemaResolverDependencies("valibot");
  if (isPackageExists("@vee-validate/valibot") && isPackageExists("valibot")) {
    logger.info("Using valibot with vee-validate");
    if (options.autoImports) {
      addImports({
        name: "toTypedSchema",
        as: "toTypedSchema",
        from: "@vee-validate/valibot"
      });
    }
    return true;
  }
  return false;
}
function checkForZod(options) {
  checkSchemaResolverDependencies("zod");
  if (isPackageExists("@vee-validate/zod") && isPackageExists("zod")) {
    logger.info("Using zod with vee-validate");
    if (options.autoImports) {
      addImports({
        name: "toTypedSchema",
        as: "toTypedSchema",
        from: "@vee-validate/zod"
      });
    }
    return true;
  }
  return false;
}
function checkForYup(options) {
  checkSchemaResolverDependencies("yup");
  if (isPackageExists("@vee-validate/yup") && isPackageExists("yup")) {
    logger.info("Using yup with vee-validate");
    if (options.autoImports) {
      addImports({
        name: "toTypedSchema",
        as: "toTypedSchema",
        from: "@vee-validate/yup"
      });
    }
    return true;
  }
  return false;
}

export { module as default };
