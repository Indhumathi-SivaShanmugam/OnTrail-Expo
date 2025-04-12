import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { startScan, stopScan, connectAndSend, disconnectDevice } from '../ble/BleScanner';
import { requestBluetoothPermissions } from '../ble/permissions';

const HomeScreen = () => {
  const [devices, setDevices] = useState([]);
  const [message, setMessage] = useState('Hello BLE!');
  const [isScanning, setIsScanning] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (text) => {
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${text}`, ...prev.slice(0, 20)]);
  };

  useEffect(() => {
    const init = async () => {
      addLog('Requesting permissions...');
      await requestBluetoothPermissions();
    };
    init();
    
    return () => {
      addLog('Cleaning up...');
      stopScan();
      disconnectDevice();
    };
  }, []);

  const toggleScan = () => {
    if (isScanning) {
      addLog('Scan stopped');
      stopScan();
      setIsScanning(false);
    } else {
      addLog('Scanning for nRF Connect devices...');
      setDevices([]);
      startScan(device => {
        addLog(`Found: ${device.name} (${device.id})`);
        setDevices(prev => {
          const exists = prev.some(d => d.id === device.id);
          return exists ? prev : [...prev, device];
        });
      });
      setIsScanning(true);
    }
  };

  const handleSend = async (device) => {
    if (!message.trim()) {
      Alert.alert('Error', 'Message is empty');
      return;
    }

    addLog(`Attempting to send to ${device.id}`);
    setIsBusy(true);
    try {
      await connectAndSend(device.id, message);
      addLog(`Message sent to ${device.name}`);
      Alert.alert('Success', `Sent to ${device.name}`);
    } catch (error) {
      addLog(`Send failed: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={isScanning ? "Stop Scan" : "Scan nRF Connect Devices"}
        onPress={toggleScan}
        disabled={isBusy}
        color={isScanning ? "red" : "green"}
      />

      <TextInput
        placeholder="Type message to send"
        value={message}
        onChangeText={setMessage}
        style={styles.input}
        editable={!isBusy}
      />

      <ScrollView style={styles.devicesContainer}>
        {devices.map(device => (
          <View key={device.id} style={styles.deviceCard}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceId}>{device.id}</Text>
            <Text>RSSI: {device.rssi} dBm</Text>
            <Button
              title="Send Test Message"
              onPress={() => handleSend(device)}
              disabled={isBusy}
            />
          </View>
        ))}
      </ScrollView>

      <ScrollView style={styles.logsContainer}>
        {logs.map((log, i) => (
          <Text key={i} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5'
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 5
  },
  devicesContainer: {
    flex: 1,
    marginBottom: 10
  },
  deviceCard: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  deviceName: {
    fontWeight: 'bold',
    fontSize: 16
  },
  deviceId: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
    marginVertical: 3
  },
  logsContainer: {
    height: 120,
    backgroundColor: 'black',
    padding: 5
  },
  logText: {
    color: 'lightgreen',
    fontSize: 12,
    fontFamily: 'monospace'
  }
});

export default HomeScreen;