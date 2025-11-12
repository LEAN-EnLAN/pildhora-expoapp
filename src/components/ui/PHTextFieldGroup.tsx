import React from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { PHTextField, PHTextFieldProps } from './PHTextField';
import { textfieldTokens } from './textfieldTokens';

type RowKind = 'placeholder' | 'input' | 'value';

export type PHTextFieldGroupProps = {
  rows: Array<
    | ({ kind: 'placeholder'; text: string })
    | ({ kind: 'input'; props: PHTextFieldProps; showClear?: boolean; onClear?: () => void })
    | ({ kind: 'value'; text: string })
  >;
  appearance?: 'light' | 'dark' | 'automatic';
  style?: any;
};

export function PHTextFieldGroup({ rows, appearance = 'automatic', style }: PHTextFieldGroupProps) {
  return (
    <View style={[styles.card, style]}> 
      {rows.map((row, idx) => {
        const isLast = idx === rows.length - 1;
        return (
          <View key={idx} style={styles.rowContainer}>
            {row.kind === 'placeholder' && (
              <Text style={styles.placeholder}>{row.text}</Text>
            )}
            {row.kind === 'input' && (
              <View style={styles.inputRow}> 
                <PHTextField {...row.props} appearance={appearance} />
                {row.showClear ? (
                  <TouchableOpacity accessibilityLabel="clear" onPress={row.onClear} style={styles.clearButton}>
                    <Text style={styles.clearText}>×</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
            {row.kind === 'value' && (
              <Text style={styles.value}>{row.text}</Text>
            )}
            {!isLast && <View style={styles.separator} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    backgroundColor: Platform.OS === 'ios' ? undefined : '#FFFFFF',
    overflow: 'hidden',
  },
  rowContainer: {
    paddingHorizontal: textfieldTokens.paddingHorizontal,
    minHeight: textfieldTokens.rowHeight,
    justifyContent: 'center',
  },
  placeholder: {
    color: Platform.OS === 'ios' ? undefined : '#9CA3AF',
    fontSize: textfieldTokens.fontSize,
    lineHeight: textfieldTokens.lineHeight,
    letterSpacing: textfieldTokens.letterSpacing,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    width: 20,
    alignItems: 'center',
  },
  clearText: {
    color: '#9CA3AF',
    fontSize: 17,
    lineHeight: 22,
  },
  value: {
    color: Platform.OS === 'ios' ? undefined : '#000000',
    fontSize: textfieldTokens.fontSize,
    lineHeight: textfieldTokens.lineHeight,
    letterSpacing: textfieldTokens.letterSpacing,
  },
  separator: {
    height: 1,
    backgroundColor: Platform.OS === 'ios' ? undefined : textfieldTokens.separatorLight,
  },
});

