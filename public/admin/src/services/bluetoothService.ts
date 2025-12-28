import api from './api';

export interface BluetoothDevice {
    id: string;
    name: string;
    alias?: string;
    address: string;
    type: BluetoothDeviceType;
    bondState: BondState;
    isConnected: boolean;
    isBleDevice: boolean;
    isA2dpDevice: boolean;
    isHeadset: boolean;
    isHearingAid: boolean;
    isLeAudioDevice: boolean;
    isMapClient: boolean;
    isMapServer: boolean;
    isPanu: boolean;
    isPbapClient: boolean;
    isPhonebookAccess: boolean;
    isSap: boolean;
    isAvrcpController: boolean;
    isAvrcpTarget: boolean;
    isDun: boolean;
    isHidDevice: boolean;
    isHidHost: boolean;
    isMap: boolean;
    isOpp: boolean;
    isPan: boolean;
    isPbap: boolean;
    isProfile: boolean;
    isUuid: boolean;
    isBle: boolean;
    isClassic: boolean;
    isDualMode: boolean;
    isLe: boolean;
    uuids?: string[];
    rssi?: number;
    txPower?: number;
    serviceData?: { [key: string]: string | number[] };
    manufacturerData?: { [key: number]: string | number[] };
    serviceUuids?: string[];
    solicitedServiceUuids?: string[];
    isConnectable?: boolean;
    isLegacy?: boolean;
    isDataNotSolicited?: boolean;
    isLimitedDiscoverable?: boolean;
    isGeneralDiscoverable?: boolean;
    isNameRequestComplete?: boolean;
    isRssiReported?: boolean;
    isTxPowerLevelPresent?: boolean;
    isServiceDataPresent?: boolean;
    isManufacturerSpecificDataPresent?: boolean;
    isServiceDataUuidPresent?: boolean;
    isCompleteLocalNamePresent?: boolean;
    isShortenedLocalNamePresent?: boolean;
    isTxPowerLevelPresentInAdvertisement?: boolean;
    isPublicAddress?: boolean;
    isRandomAddress?: boolean;
    isStaticAddress?: boolean;
    isNonResolvablePrivateAddress?: boolean;
    isResolvablePrivateAddress?: boolean;
    isLeLimitedDiscoverable?: boolean;
    isLeGeneralDiscoverable?: boolean;
    isLeBrEdrController?: boolean;
    isLeBrEdrHost?: boolean;
    isLeOnlyController?: boolean;
    isLeOnlyHost?: boolean;
    isLeAudioCapable?: boolean;
    isLeAudioSupported?: boolean;
}

export enum BluetoothDeviceType {
    UNKNOWN = 'UNKNOWN',
    CLASSIC = 'CLASSIC',
    LE = 'LE',
    DUAL = 'DUAL',
}

export enum BondState {
    NONE = 'NONE',
    BONDING = 'BONDING',
    BONDED = 'BONDED',
}

export enum ConnectionState {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTING = 'DISCONNECTING',
}

export enum BluetoothProfile {
    HEADSET = 1,
    A2DP = 2,
    HEALTH = 3,
    HID_HOST = 4,
    PAN = 5,
    PBAP = 6,
    GATT = 7,
    GATT_SERVER = 8,
    MAP = 9,
    SAP = 10,
    A2DP_SINK = 11,
    AVRCP_CONTROLLER = 12,
    AVRCP = 13,
    HEADSET_CLIENT = 16,
    PBAP_CLIENT = 17,
    MAP_MCE = 18,
    HEARING_AID = 21,
    SAP_CLIENT = 22,
    LE_AUDIO = 22,
    HAP_CLIENT = 23,
    LE_AUDIO_BROADCAST_ASSISTANT = 24,
    LE_AUDIO_BROADCAST_SOURCE = 25,
    LE_AUDIO_BROADCAST_SINK = 26,
    LE_AUDIO_UNICAST_CLIENT = 27,
    LE_AUDIO_UNICAST_SERVER = 28,
}

export enum BluetoothStatus {
    SUCCESS = 0,
    ERROR = -1,
    ERROR_BLUETOOTH_NOT_ENABLED = -2,
    ERROR_BLUETOOTH_NOT_SUPPORTED = -3,
    ERROR_DEVICE_NOT_FOUND = -4,
    ERROR_DEVICE_NOT_CONNECTED = -5,
    ERROR_SERVICE_DISCOVERY_FAILED = -6,
    ERROR_CONNECTION_FAILED = -7,
    ERROR_DISCONNECT_FAILED = -8,
    ERROR_READ_FAILED = -9,
    ERROR_WRITE_FAILED = -10,
    ERROR_INVALID_DATA = -11,
    ERROR_INVALID_REQUEST = -12,
    ERROR_OPERATION_TIMEOUT = -13,
    ERROR_OPERATION_CANCELED = -14,
    ERROR_OPERATION_IN_PROGRESS = -15,
    ERROR_OPERATION_NOT_SUPPORTED = -16,
    ERROR_PERMISSION_DENIED = -17,
    ERROR_SERVICE_NOT_FOUND = -18,
    ERROR_SERVICE_DISCOVERY_NOT_STARTED = -19,
    ERROR_ALREADY_CONNECTED = -20,
    ERROR_NOT_CONNECTED = -21,
    ERROR_DEVICE_ALREADY_BONDED = -22,
    ERROR_DEVICE_NOT_BONDED = -23,
    ERROR_BOND_FAILED = -24,
    ERROR_REMOTE_DEVICE_DOWN = -25,
    ERROR_AUTH_FAILED = -26,
    ERROR_AUTH_REJECTED = -27,
    ERROR_AUTH_TIMEOUT = -28,
    ERROR_AUTH_CANCELED = -29,
    ERROR_AUTHENTICATION_FAILED = -30,
    ERROR_CONNECTION_LOST = -31,
    ERROR_MAXIMUM_CONNECTIONS_REACHED = -32,
    ERROR_PROTOCOL_NOT_SUPPORTED = -33,
    ERROR_SOCKET_CLOSED = -34,
    ERROR_SOCKET_NOT_CONNECTED = -35,
    ERROR_SOCKET_CONNECTION_FAILED = -36,
    ERROR_SOCKET_READ_FAILED = -37,
    ERROR_SOCKET_WRITE_FAILED = -38,
    ERROR_SOCKET_TIMEOUT = -39,
    ERROR_SOCKET_CLOSED_BY_REMOTE = -40,
    ERROR_SOCKET_CLOSED_LOCALLY = -41,
    ERROR_SOCKET_CONNECTION_LOST = -42,
    ERROR_SOCKET_CONNECTION_REFUSED = -43,
    ERROR_SOCKET_CONNECTION_TIMEOUT = -44,
    ERROR_SOCKET_DISCONNECTED = -45,
    ERROR_SOCKET_HOST_DOWN = -46,
    ERROR_SOCKET_HOST_UNREACHABLE = -47,
    ERROR_SOCKET_NETWORK_DOWN = -48,
    ERROR_SOCKET_NETWORK_RESET = -49,
    ERROR_SOCKET_NETWORK_UNREACHABLE = -50,
    ERROR_SOCKET_NO_BUFFERS = -51,
    ERROR_SOCKET_NOT_BOUND = -52,
    ERROR_SOCKET_SHUTDOWN = -54,
    ERROR_SOCKET_WOULD_BLOCK = -55,
    ERROR_UNKNOWN = -9999,
}

export interface BluetoothGattService {
    uuid: string;
    type: 'primary' | 'secondary';
    characteristics: BluetoothGattCharacteristic[];
    includedServices?: BluetoothGattService[];
    instanceId?: string;
    typeNumber?: number;
}

export interface BluetoothGattCharacteristic {
    uuid: string;
    properties: BluetoothGattCharacteristicProperties;
    permissions: BluetoothGattPermission[];
    descriptors?: BluetoothGattDescriptor[];
    value?: string | number[];
    writeType?: 'write' | 'writeNoResponse' | 'signedWrite';
    isNotifiable?: boolean;
    isIndicatable?: boolean;
    isReadable?: boolean;
    isWritable?: boolean;
    isWritableWithoutResponse?: boolean;
    isSignedWrite?: boolean;
    isReliableWrite?: boolean;
    isNotifying?: boolean;
    isBroadcast?: boolean;
    isExtendedProps?: boolean;
    isAuthenticatedSignedWrites?: boolean;
    isIndicationEnabled?: boolean;
    isNotificationEnabled?: boolean;
    isWriteableAuxiliaries?: boolean;
}

export interface BluetoothGattDescriptor {
    uuid: string;
    permissions: BluetoothGattPermission[];
    value?: string | number[];
    isReadable?: boolean;
    isWritable?: boolean;
    isEncryptedRead?: boolean;
    isEncryptedWrite?: boolean;
    isEncryptedMitmRead?: boolean;
    isEncryptedMitmWrite?: boolean;
    isSignedWrite?: boolean;
    isSignedMitmWrite?: boolean;
}

export enum BluetoothGattCharacteristicProperties {
    BROADCAST = 0x01,
    READ = 0x02,
    WRITE_NO_RESPONSE = 0x04,
    WRITE = 0x08,
    NOTIFY = 0x10,
    INDICATE = 0x20,
    SIGNED_WRITE = 0x40,
    EXTENDED_PROPS = 0x80,
    NOTIFY_ENCRYPTION_REQUIRED = 0x100,
    INDICATE_ENCRYPTION_REQUIRED = 0x200,
}

export enum BluetoothGattPermission {
    READ = 0x01,
    READ_ENCRYPTED = 0x02,
    READ_ENCRYPTED_MITM = 0x04,
    WRITE = 0x10,
    WRITE_ENCRYPTED = 0x20,
    WRITE_ENCRYPTED_MITM = 0x40,
    WRITE_SIGNED = 0x80,
    WRITE_SIGNED_MITM = 0x100,
}

export interface BluetoothGattCallback {
    onConnectionStateChange?: (device: BluetoothDevice, status: number, newState: number) => void;
    onServicesDiscovered?: (device: BluetoothDevice, status: number) => void;
    onCharacteristicRead?: (device: BluetoothDevice, characteristic: BluetoothGattCharacteristic, status: number) => void;
    onCharacteristicWrite?: (device: BluetoothDevice, characteristic: BluetoothGattCharacteristic, status: number) => void;
    onCharacteristicChanged?: (device: BluetoothDevice, characteristic: BluetoothGattCharacteristic) => void;
    onDescriptorRead?: (device: BluetoothDevice, descriptor: BluetoothGattDescriptor, status: number) => void;
    onDescriptorWrite?: (device: BluetoothDevice, descriptor: BluetoothGattDescriptor, status: number) => void;
    onReliableWriteCompleted?: (device: BluetoothDevice, status: number) => void;
    onReadRemoteRssi?: (device: BluetoothDevice, rssi: number, status: number) => void;
    onMtuChanged?: (device: BluetoothDevice, mtu: number, status: number) => void;
    onPhyRead?: (device: BluetoothDevice, txPhy: number, rxPhy: number, status: number) => void;
    onPhyUpdate?: (device: BluetoothDevice, txPhy: number, rxPhy: number, status: number) => void;
}

/**
 * Check if Bluetooth is supported and enabled
 */
export const isBluetoothSupported = async (deviceId: string): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/bluetooth/supported`);
    return response.data.supported;
};

export const isBluetoothEnabled = async (deviceId: string): Promise<boolean> => {
    const response = await api.get(`/devices/${deviceId}/bluetooth/enabled`);
    return response.data.enabled;
};

/**
 * Enable/Disable Bluetooth
 */
export const setBluetoothEnabled = async (deviceId: string, enabled: boolean): Promise<boolean> => {
    const response = await api.post(`/devices/${deviceId}/bluetooth/set-enabled`, { enabled });
    return response.data.success;
};

/**
 * Get Bluetooth adapter info
 */
export const getAdapterInfo = async (deviceId: string): Promise<{
    name: string;
    address: string;
    state: number;
    scanMode: number;
    isDiscovering: boolean;
    isMultipleAdvertisementSupported: boolean;
    isOffloadedFilteringSupported: boolean;
    isOffloadedScanBatchingSupported: boolean;
    isLe2MPhySupported: boolean;
    isLeCodedPhySupported: boolean;
    isLeExtendedAdvertisingSupported: boolean;
    isLePeriodicAdvertisingSupported: boolean;
    isLeAudioSupported: boolean;
    isLeAudioBroadcastSourceSupported: boolean;
    isLeAudioBroadcastSinkSupported: boolean;
    isLeAudioUnicastClientSupported: boolean;
    isLeAudioUnicastServerSupported: boolean;
    maxLeAudioCodecChannelsSupported: number;
    maxLeAudioCodecFramesPerSdu: number;
    maxLeAudioCodecSampleRate: number;
    maxLeAudioCodecBitDepth: number;
    maxLeAudioCodecBitrate: number;
    maxLeAudioCodecLatency: number;
    maxLeAudioCodecPreference: number;
    maxLeAudioCodecQuality: number;
    maxLeAudioCodecType: number;
    maxLeAudioCodecVendorId: number;
    maxLeAudioCodecCodecId: number;
    maxLeAudioCodecConfiguration: number;
    maxLeAudioCodecConfigurationBitsPerSample: number;
    maxLeAudioCodecConfigurationChannelCount: number;
    maxLeAudioCodecConfigurationFrameDuration: number;
    maxLeAudioCodecConfigurationOctetsPerFrame: number;
    maxLeAudioCodecConfigurationSampleRate: number;
    maxLeAudioCodecConfigurationType: number;
    maxLeAudioCodecConfigurationVendorId: number;
    maxLeAudioCodecConfigurationCodecId: number;
    maxLeAudioCodecConfigurationBitsPerSampleMask: number;
    maxLeAudioCodecConfigurationChannelCountMask: number;
    maxLeAudioCodecConfigurationFrameDurationMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMask: number;
    maxLeAudioCodecConfigurationSampleRateMask: number;
    maxLeAudioCodecConfigurationTypeMask: number;
    maxLeAudioCodecConfigurationVendorIdMask: number;
    maxLeAudioCodecConfigurationCodecIdMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleShift: number;
    maxLeAudioCodecConfigurationChannelCountShift: number;
    maxLeAudioCodecConfigurationFrameDurationShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameShift: number;
    maxLeAudioCodecConfigurationSampleRateShift: number;
    maxLeAudioCodecConfigurationTypeShift: number;
    maxLeAudioCodecConfigurationVendorIdShift: number;
    maxLeAudioCodecConfigurationCodecIdShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskShift: number;
    maxLeAudioCodecConfigurationTypeMaskShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMasked: number;
    maxLeAudioCodecConfigurationChannelCountMasked: number;
    maxLeAudioCodecConfigurationFrameDurationMasked: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMasked: number;
    maxLeAudioCodecConfigurationSampleRateMasked: number;
    maxLeAudioCodecConfigurationTypeMasked: number;
    maxLeAudioCodecConfigurationVendorIdMasked: number;
    maxLeAudioCodecConfigurationCodecIdMasked: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedShift: number;
    maxLeAudioCodecConfigurationTypeMaskedShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMask: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMask: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMask: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMask: number;
    maxLeAudioCodecConfigurationTypeMaskedMask: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMask: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMasked: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMasked: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMasked: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMasked: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMasked: number;
    maxLeAudioCodecConfigurationTypeMaskedMasked: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMasked: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMasked: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMaskedMasked: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMaskedMaskedShift: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationOctetsPerFrameMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationSampleRateMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationTypeMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationVendorIdMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationCodecIdMaskedMaskedMaskedMaskedMaskedMaskedMaskedMask: number;
    maxLeAudioCodecConfigurationBitsPerSampleMaskedMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationChannelCountMaskedMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;
    maxLeAudioCodecConfigurationFrameDurationMaskedMaskedMaskedMaskedMaskedMaskedMaskedMaskShift: number;