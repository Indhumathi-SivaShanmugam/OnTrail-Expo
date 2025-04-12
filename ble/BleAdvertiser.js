import BleAdvertiser from 'react-native-ble-advertiser';

export const startAdvertising = async (deviceName = 'BLE Device') => {
  await BleAdvertiser.setCompanyId(0x004C); // Apple's company ID
  
  return BleAdvertiser.broadcast(
    deviceName,
    ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E'], // NUS UUID
    {
      advertiseMode: 'LowLatency',
      connectable: true,
      includeDeviceName: true
    }
  );
};

export const stopAdvertising = () => BleAdvertiser.stopBroadcast();