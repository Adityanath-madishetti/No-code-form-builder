import { useFormStore } from './form.store';
import type { Form, FormPage } from '../components/base';
import type { AnyFormComponent, AnySerializedComponent } from '../registry/componentRegistry';
import { deserializeComponent, serializeComponent } from '../registry/componentRegistry';

/**
 * Serializable representation of the form.
 * This is what gets stored / sent over network.
 */
export interface SerializedForm {
  form: Form;
  pages: FormPage[];
  components: AnySerializedComponent[];
}

/**
 * Loads a serialized form into the store.
 *
 * - Deserializes components using registry
 * - Hydrates Zustand store
 */
export function loadFromJSON(json: SerializedForm) {
  // Force TS to retain the strict union type during the map iteration
  const components = json.components.map(
    (c) => deserializeComponent(c) as AnyFormComponent
  );
  useFormStore.getState().loadForm(json.form, json.pages, components);
}

export function serializeForm(): SerializedForm {
  const state = useFormStore.getState();
  if (!state.form) throw new Error('No form loaded');

  return serializeFormFromState({
    form: state.form,
    pages: state.pages,
    components: state.components,
  });
}

export function serializeFormFromState(state: {
  form: Form;
  pages: Record<string, FormPage>;
  components: Record<string, AnyFormComponent>;
}): SerializedForm {
  return {
    form: state.form,
    pages: state.form.pages.map((id) => state.pages[id]),
    components: state.form.pages.flatMap((pageId) =>
      state.pages[pageId].children.map(
        // Force TS to retain the strict serialized union type
        (id) =>
          serializeComponent(state.components[id]) as AnySerializedComponent
      )
    ),
  };
}

export function printFormJSON() {
  const serialized = serializeForm();
  console.log(JSON.stringify(serialized, null, 2));
}
