import { useForm, useFieldArray, FieldEntry, FormContext, FieldArrayContext } from '@/vee-validate';
import { nextTick, onMounted, Ref } from 'vue';
import * as yup from 'yup';
import { mountWithHoc, flushPromises } from './helpers';

test('can update a field entry model directly', async () => {
  mountWithHoc({
    setup() {
      useForm({
        initialValues: {
          users: ['1'],
        },
      });

      const { fields } = useFieldArray('users');
      onMounted(() => {
        const item = fields.value[0];
        item.value = 'test';
      });

      return {
        fields,
      };
    },
    template: `
      <p>{{ fields[0].value }}</p>
    `,
  });

  await flushPromises();
  expect(document.querySelector('p')?.innerHTML).toBe('test');
});

test('can update a field entry deep model directly and validate it', async () => {
  let fields!: Ref<FieldEntry<{ name: string }>[]>;
  mountWithHoc({
    setup() {
      const { errors } = useForm({
        validateOnMount: true,
        validationSchema: yup.object({
          users: yup.array().of(
            yup.object({
              name: yup.string().required(),
            })
          ),
        }),
        initialValues: {
          users: [{ name: '' }],
        },
      });

      fields = useFieldArray<{ name: string }>('users').fields;

      return {
        fields,
        errors,
      };
    },
    template: `
      <p>{{ fields[0].value.name }}</p>
      <span>{{ errors }}</span>
    `,
  });

  await flushPromises();
  expect(document.querySelector('p')?.innerHTML).toBe('');
  expect(document.querySelector('span')?.innerHTML).toBeTruthy();

  const item = fields.value[0];
  item.value.name = 'test';

  await flushPromises();
  expect(document.querySelector('p')?.innerHTML).toBe('test');
  expect(document.querySelector('span')?.innerHTML).toBe('{}');
});

test('warns when updating a no-longer existing item', async () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {
    // NOOP
  });
  mountWithHoc({
    setup() {
      useForm({
        initialValues: {
          users: ['1'],
        },
      });

      const { remove, fields } = useFieldArray('users');
      onMounted(() => {
        const item = fields.value[0];
        remove(0);
        item.value = 'test';
      });
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();

  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('duplicate calls yields the same instance', async () => {
  let removeFn!: (idx: number) => void;
  mountWithHoc({
    setup() {
      useForm({
        initialValues: {
          users: ['one'],
        },
      });

      const { fields, push } = useFieldArray('users');
      const { fields: fields2, remove } = useFieldArray('users');

      removeFn = remove;

      onMounted(() => {
        push('two');
      });

      return {
        fields,
        fields2,
      };
    },
    template: `
      <p id="arr1">{{ fields.map(f => f.value).join(', ') }}</p>
      <p id="arr2">{{ fields2.map(f => f.value).join(', ') }}</p>
    `,
  });

  await flushPromises();
  expect(document.querySelector('#arr1')?.innerHTML).toBe('one, two');
  expect(document.querySelector('#arr2')?.innerHTML).toBe('one, two');
  removeFn(0);
  await flushPromises();
  expect(document.querySelector('#arr1')?.innerHTML).toBe('two');
  expect(document.querySelector('#arr2')?.innerHTML).toBe('two');
});

// #4096
test('array push should trigger a silent validation', async () => {
  let form!: FormContext;
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      form = useForm<any>({
        initialValues: {
          users: ['one'],
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(form.meta.value.valid).toBe(true);
  arr.push('');
  await flushPromises();
  expect(form.meta.value.valid).toBe(false);
});

// #4096
test('array prepend should trigger a silent validation', async () => {
  let form!: FormContext;
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      form = useForm<any>({
        initialValues: {
          users: ['one'],
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(form.meta.value.valid).toBe(true);
  arr.prepend('');
  await flushPromises();
  expect(form.meta.value.valid).toBe(false);
});

// #4096
test('array insert should trigger a silent validation', async () => {
  let form!: FormContext;
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      form = useForm<any>({
        initialValues: {
          users: ['one', 'two'],
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(form.meta.value.valid).toBe(true);
  arr.insert(1, '');
  await flushPromises();
  expect(form.meta.value.valid).toBe(false);
});
