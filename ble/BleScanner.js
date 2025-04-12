import BleManager from './BleManagerWrapper';

// Nordic UART Service for nRF Connect
const NUS_SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';

export const startScan = (onDeviceFound) => {
  return BleManager.startDeviceScan(
    null, // Scan ALL BLE devices
    {
      scanMode: 'LowLatency',
      allowDuplicates: false,
      callbackType: 'AllDevices'
    },
    (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (!device?.id) return;

      // Determine if it's an nRF Connect device
      const isNRFConnect = device.serviceUUIDs?.includes(NUS_SERVICE_UUID) || 
                         device.advertising?.serviceUUIDs?.includes(NUS_SERVICE_UUID);

      // Get the best available name
      const deviceName = device.localName || 
                        device.name || 
                        (isNRFConnect ? 'nRF Connect Device' : 'Unnamed BLE Device');

      onDeviceFound({
        id: device.id,
        name: deviceName,
        rssi: device.rssi,
        isNRFConnect,
        rawData: device // For debugging
      });
    }
  );
};

export const stopScan = () => BleManager.stopDeviceScan();

export const connectAndSend = async (deviceId, message) => {
  try {
    const device = await BleManager.connectToDevice(deviceId, {
      autoConnect: false,
      requestMTU: 247
    });
    
    await device.discoverAllServicesAndCharacteristics();
    
    // Try Nordic UART Service first
    try {
      await device.writeCharacteristicWithResponseForService(
        NUS_SERVICE_UUID,
        '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
        Buffer.from(message).toString('base64')
      );
      return true;
    } catch (nrfError) {
      console.log('Not an nRF device, trying generic write...');
      // Fallback to first writable characteristic
      const services = await device.services();
      for (const service of services) {
        const chars = await service.characteristics();
        for (const char of chars) {
          if (char.isWritableWithResponse) {
            await device.writeCharacteristicWithResponseForService(
              service.uuid,
              char.uuid,
              Buffer.from(message).toString('base64')
            );
            return true;
          }
        }
      }
      throw new Error('No writable characteristic found');
    }
  } catch (error) {
    console.error('Communication error:', error);
    throw error;
  }
};