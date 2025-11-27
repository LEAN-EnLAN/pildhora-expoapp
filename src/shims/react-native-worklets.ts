// Minimal stub to prevent web/runtime crashes when a module references react-native-worklets
// No-op implementations ensure safe behavior on platforms without native worklets

type Serializable = any;

export const WorkletsModule = {
  createSerializableObject: (_obj: Record<string, any>): Serializable => ({}),
  createSerializableArray: (_values: any[]): Serializable => ([]),
  createSerializableString: (_str: string): Serializable => (''),
  createSerializableNumber: (_num: number): Serializable => (0),
  createSerializableBoolean: (_b: boolean): Serializable => (false),
  createSerializableNull: (): Serializable => null,
  createSerializableUndefined: (): Serializable => undefined,
  createSerializableFunction: (_fn: Function): Serializable => ({}),
  createSerializableWorklet: (_fn: Function): Serializable => ({}),
  scheduleOnUI: (_serializable: Serializable): void => {},
  executeOnUIRuntimeSync: (_serializable: Serializable): void => {},
  createWorkletRuntime: (_name?: string): Serializable => ({}),
  scheduleOnRuntime: (_runtime: Serializable, _serializable: Serializable): void => {},
  reportFatalErrorOnJS: (_message: string): void => {},
  getStaticFeatureFlag: (_name: string): boolean => false,
  setDynamicFeatureFlag: (_name: string, _value: boolean): void => {},
};

export default WorkletsModule;
