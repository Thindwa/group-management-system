import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { cleanupOrphanedUsers } from '../../utils/cleanupOrphanedUsers';
import { checkForDuplicateProfiles } from '../../utils/checkDuplicates';

export default function DebugScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runCleanup = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      addLog('Starting cleanup...');
      await cleanupOrphanedUsers();
      addLog('Cleanup completed');
    } catch (error: any) {
      addLog(`Cleanup error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const checkDuplicates = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      addLog('Checking for duplicates...');
      const profiles = await checkForDuplicateProfiles();
      addLog(`Found ${profiles?.length || 0} profiles`);
    } catch (error: any) {
      addLog(`Check error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Tools</Text>
        <Text style={styles.subtitle}>Admin utilities for troubleshooting</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runCleanup}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running...' : 'Cleanup Orphaned Users'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={checkDuplicates}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running...' : 'Check Duplicates'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  clearButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1F2937',
  },
  logText: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
