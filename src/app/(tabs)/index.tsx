import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import NumberKeypad from '@/components/NumberKeypad';

export default function KeypadScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <NumberKeypad />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    flex: 1,
  },
});
