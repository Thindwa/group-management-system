import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useController, Control, FieldPath, FieldValues } from 'react-hook-form';

interface MoneyInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  currency?: string;
  disabled?: boolean;
}

export default function MoneyInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "0",
  currency = "MWK",
  disabled = false,
}: MoneyInputProps<T>) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    control,
    name,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleTextChange = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    const amount = numericValue ? parseInt(numericValue, 10) : 0;
    onChange(amount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.currency}>{currency}</Text>
        <TextInput
          style={[styles.input, disabled && styles.disabled]}
          value={value ? value.toString() : ''}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          keyboardType="numeric"
          editable={!disabled}
        />
      </View>
      {error && <Text style={styles.error}>{error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#111827',
  },
  disabled: {
    backgroundColor: '#F9FAFB',
    color: '#9CA3AF',
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
});