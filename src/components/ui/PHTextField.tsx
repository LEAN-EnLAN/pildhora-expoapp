import React, { useImperativeHandle, forwardRef, useRef } from 'react';
import { Platform, UIManager, requireNativeComponent, TextInput as RNTextInput, View, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { textfieldTokens } from './textfieldTokens';

type KeyboardType = TextInputProps['keyboardType'];

export type PHTextFieldProps = {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;
  secure?: boolean;
  keyboardType?: KeyboardType;
  returnKeyType?: TextInputProps['returnKeyType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  appearance?: 'light' | 'dark' | 'automatic';
  style?: any;
};

const NativeAvailable = Platform.OS === 'ios' && !!(UIManager as any).getViewManagerConfig?.('PHTextField');
const IOSNative = NativeAvailable ? requireNativeComponent<any>('PHTextField') : null;

export const PHTextField = forwardRef<RNTextInput, PHTextFieldProps>(function PHTextField(props, ref) {
  const fallbackRef = useRef<RNTextInput>(null);
  useImperativeHandle(ref, () => fallbackRef.current as RNTextInput);

  if (IOSNative && Platform.OS === 'ios') {
    return (
      <IOSNative
        style={[styles.row, props.style]}
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        errorMessage={props.errorMessage}
        secure={props.secure}
        keyboardType={props.keyboardType}
        returnKeyType={props.returnKeyType}
        autoCapitalize={props.autoCapitalize}
        onChangeText={props.onChangeText}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onSubmitEditing={props.onSubmitEditing}
        appearance={props.appearance || 'automatic'}
      />
    );
  }

  return (
    <View style={[styles.row, props.style]}>
      <RNTextInput
        ref={fallbackRef}
        value={props.value}
        placeholder={props.placeholder}
        editable={!props.disabled}
        secureTextEntry={!!props.secure}
        keyboardType={props.keyboardType}
        returnKeyType={props.returnKeyType}
        autoCapitalize={props.autoCapitalize}
        onChangeText={props.onChangeText}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onSubmitEditing={props.onSubmitEditing}
        style={styles.input}
        placeholderTextColor={Platform.OS === 'ios' ? undefined : '#9CA3AF'}
      />
      {props.errorMessage ? <View style={[styles.separator, styles.separatorError]} /> : <View style={styles.separator} />}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    height: textfieldTokens.rowHeight,
    justifyContent: 'center',
    paddingHorizontal: textfieldTokens.paddingHorizontal,
    backgroundColor: '#FFFFFF',
    borderRadius: textfieldTokens.borderRadius,
    shadowColor: textfieldTokens.shadowColor,
    shadowOpacity: textfieldTokens.shadowOpacity,
    shadowRadius: textfieldTokens.shadowRadius,
    shadowOffset: { width: textfieldTokens.shadowOffsetH, height: textfieldTokens.shadowOffsetV },
    elevation: textfieldTokens.elevation,
  },
  input: {
    fontSize: textfieldTokens.fontSize,
    lineHeight: textfieldTokens.lineHeight,
    letterSpacing: textfieldTokens.letterSpacing,
  },
  separator: {
    position: 'absolute',
    left: textfieldTokens.paddingHorizontal,
    right: textfieldTokens.paddingHorizontal,
    bottom: 0,
    height: 1,
    backgroundColor: Platform.OS === 'ios' ? undefined : textfieldTokens.separatorLight,
  },
  separatorError: {
    backgroundColor: '#FF3B30',
  },
});
